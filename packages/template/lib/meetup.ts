import config from "@/site.config";

const MEETUP_API_URL = "https://api.meetup.com/gql-ext";
const GROUP_URLNAME = config.meetup?.groupSlug ?? "";

export const isMeetupConfigured = !!(
  GROUP_URLNAME &&
  process.env.MEETUP_CLIENT_ID &&
  process.env.MEETUP_CLIENT_SECRET &&
  (process.env.MEETUP_OAUTH_TOKEN || process.env.MEETUP_OAUTH_REFRESH_TOKEN)
);

let cachedAccessToken: string | null = null;

async function refreshAccessToken(): Promise<string> {
  const clientId = process.env.MEETUP_CLIENT_ID;
  const clientSecret = process.env.MEETUP_CLIENT_SECRET;
  const refreshToken = process.env.MEETUP_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing MEETUP_CLIENT_ID, MEETUP_CLIENT_SECRET, or MEETUP_OAUTH_REFRESH_TOKEN",
    );
  }

  const res = await fetch("https://secure.meetup.com/oauth2/access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meetup token refresh failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Meetup token refresh error: ${data.error}`);
  }

  cachedAccessToken = data.access_token;
  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken;

  const token = process.env.MEETUP_OAUTH_TOKEN;
  if (token) {
    cachedAccessToken = token;
    return token;
  }

  return refreshAccessToken();
}

async function meetupFetch(query: string, variables: Record<string, unknown>) {
  let token = await getAccessToken();

  let res = await fetch(MEETUP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  // If unauthorized, try refreshing the token once
  if (res.status === 401) {
    token = await refreshAccessToken();
    res = await fetch(MEETUP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meetup API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(
      `Meetup GraphQL error: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }

  return json.data;
}

export async function findVenueId(): Promise<string | null> {
  const data = await meetupFetch(
    `query($urlname: String!) {
      groupByUrlname(urlname: $urlname) {
        events(first: 5) {
          edges {
            node {
              venue {
                id
                name
              }
            }
          }
        }
      }
    }`,
    { urlname: GROUP_URLNAME },
  );

  const group = data.groupByUrlname;
  const allEvents = group.events?.edges ?? [];

  for (const edge of allEvents) {
    if (edge.node?.venue?.id) {
      return edge.node.venue.id;
    }
  }

  return null;
}

export async function createMeetupEvent(event: {
  title: string;
  description: string;
  startAt: string;
  endAt?: string | null;
  venueId?: string;
}): Promise<{ meetupEventId: string; meetupUrl: string }> {
  let venueId = event.venueId;

  if (!venueId) {
    venueId = (await findVenueId()) ?? undefined;
  }

  const startDate = new Date(event.startAt);
  const duration = event.endAt
    ? `PT${Math.round((new Date(event.endAt).getTime() - startDate.getTime()) / 60000)}M`
    : "PT120M";

  const data = await meetupFetch(
    `mutation($input: CreateEventInput!) {
      createEvent(input: $input) {
        event {
          id
          eventUrl
        }
        errors {
          message
          code
          field
        }
      }
    }`,
    {
      input: {
        groupUrlname: GROUP_URLNAME,
        title: event.title,
        description: event.description,
        startDateTime: startDate.toISOString(),
        duration,
        ...(venueId ? { venueId } : {}),
        publishStatus: "PUBLISHED",
      },
    },
  );

  const result = data.createEvent;
  if (result.errors?.length) {
    throw new Error(
      `Meetup create event error: ${result.errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }

  return {
    meetupEventId: result.event.id,
    meetupUrl: result.event.eventUrl,
  };
}

export function extractMeetupEventId(meetupUrl: string): string | null {
  // URL format: https://www.meetup.com/tampa-bay-bitcoin/events/305234567/
  const match = meetupUrl.match(/\/events\/(\d+)/);
  return match ? match[1] : null;
}

export async function editMeetupEvent(
  meetupEventId: string,
  event: {
    title?: string;
    description?: string;
    startAt?: string;
    endAt?: string | null;
    venueId?: string;
  },
): Promise<void> {
  const input: Record<string, unknown> = { eventId: meetupEventId };

  if (event.title) input.title = event.title;
  if (event.description) input.description = event.description;

  if (event.startAt) {
    const startDate = new Date(event.startAt);
    input.startDateTime = startDate.toISOString();

    if (event.endAt) {
      const duration = Math.round(
        (new Date(event.endAt).getTime() - startDate.getTime()) / 60000,
      );
      input.duration = `PT${duration}M`;
    }
  }

  if (event.venueId) input.venueId = event.venueId;

  const data = await meetupFetch(
    `mutation($input: EditEventInput!) {
      editEvent(input: $input) {
        event {
          id
        }
        errors {
          message
          code
          field
        }
      }
    }`,
    { input },
  );

  const result = data.editEvent;
  if (result.errors?.length) {
    throw new Error(
      `Meetup edit event error: ${result.errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }
}

export async function getMeetupEventById(
  meetupEventId: string,
): Promise<MeetupEvent> {
  const data = await meetupFetch(
    `query($id: ID!) {
      event(id: $id) {
        ${EVENT_FIELDS}
      }
    }`,
    { id: meetupEventId },
  );

  return mapEventNode(data.event);
}

export async function uploadMeetupEventPhoto(
  meetupEventId: string,
  imageUrl: string,
): Promise<void> {
  // Step 1: Create photo placeholder
  const data = await meetupFetch(
    `mutation($input: GroupEventPhotoCreateInput!) {
      createGroupEventPhoto(input: $input) {
        uploadUrl
        photo {
          id
        }
      }
    }`,
    {
      input: {
        groupId: meetupEventId,
        photoType: "GROUP_PHOTO",
        contentType: "JPEG",
        setAsMain: true,
      },
    },
  );

  const uploadUrl = data.createGroupEventPhoto?.uploadUrl;
  if (!uploadUrl) return;

  // Step 2: Fetch the image and upload it
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) return;

  const imageBuffer = await imageRes.arrayBuffer();

  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: imageBuffer,
  });
}

export interface MeetupEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  endTime: string | null;
  eventUrl: string;
  going: number;
  rsvpNames: string[];
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
  } | null;
  image: {
    baseUrl: string;
  } | null;
}

const EVENT_FIELDS = `
  id
  title
  description
  dateTime
  endTime
  eventUrl
  rsvps(first: 200) {
    totalCount
    edges {
      node {
        member {
          name
        }
      }
    }
  }
  venue {
    name
    address
    city
    state
  }
  featuredEventPhoto {
    highResUrl
  }
`;

interface RsvpEdge {
  node: { member: { name: string } };
}

function mapEventNode(node: Record<string, unknown>): MeetupEvent {
  const n = node as Record<string, unknown>;
  const rsvps = n.rsvps as {
    totalCount: number;
    edges?: RsvpEdge[];
  } | null;

  return {
    id: n.id as string,
    title: n.title as string,
    description: (n.description as string) ?? "",
    dateTime: n.dateTime as string,
    endTime: (n.endTime as string) ?? null,
    eventUrl: n.eventUrl as string,
    going: rsvps?.totalCount ?? 0,
    rsvpNames: (rsvps?.edges ?? []).map((e) => e.node.member.name),
    venue: n.venue as MeetupEvent["venue"],
    image: n.featuredEventPhoto
      ? { baseUrl: (n.featuredEventPhoto as { highResUrl: string }).highResUrl }
      : null,
  };
}

export async function getMeetupEvents(): Promise<{
  upcoming: MeetupEvent[];
  past: MeetupEvent[];
}> {
  const data = await meetupFetch(
    `query($urlname: String!) {
      groupByUrlname(urlname: $urlname) {
        events(first: 50, sort: DESC) {
          edges { node { ${EVENT_FIELDS} } }
        }
      }
    }`,
    { urlname: GROUP_URLNAME },
  );

  const edges = data.groupByUrlname?.events?.edges ?? [];
  const all = edges.map((edge: { node: Record<string, unknown> }) =>
    mapEventNode(edge.node),
  );

  const now = new Date();
  const upcoming: MeetupEvent[] = [];
  const past: MeetupEvent[] = [];

  for (const event of all) {
    if (new Date(event.dateTime) >= now) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  }

  // Upcoming sorted ascending (soonest first), past stays descending (most recent first)
  upcoming.sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
  );

  return { upcoming, past };
}

export async function getGroupInfo() {
  const data = await meetupFetch(
    `query($urlname: String!) {
      groupByUrlname(urlname: $urlname) {
        id
        name
        urlname
        link
        description
        memberships {
          totalCount
        }
        events(first: 10) {
          totalCount
          edges {
            node {
              id
              title
              eventUrl
              dateTime
              rsvps {
                totalCount
              }
              venue {
                name
                address
                city
              }
            }
          }
        }
      }
    }`,
    { urlname: GROUP_URLNAME },
  );

  return data.groupByUrlname;
}
