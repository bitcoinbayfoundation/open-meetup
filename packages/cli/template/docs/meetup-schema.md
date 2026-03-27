# Meetup.com GraphQL API Schema Reference

Endpoint: `https://api.meetup.com/gql-ext`
Auth: `Authorization: Bearer <MEETUP_OAUTH_TOKEN>`
Our group urlname: `tampa-bay-bitcoin`

---

## Queries

### groupByUrlname
```graphql
groupByUrlname(urlname: String!) -> Group
```
Fetch a single group by its urlname.

### group
```graphql
group(id: ID!) -> Group
```
Fetch a single group by its id.

### event
```graphql
event(id: ID!) -> Event
```
Returns an event by id.

### eventSearch
```graphql
eventSearch(
  after: String
  dataConfiguration: String
  filter: EventSearchFilter
  first: Int
  sort: KeywordSort
) -> EventSearchConnection
```
Search events using keywords and location.

### groupSearch
```graphql
groupSearch(
  after: String
  dataConfiguration: String
  filter: GroupSearchFilter
  first: Int
) -> GroupSearchConnection
```
Search groups using keywords and location.

### recommendedEvents
```graphql
recommendedEvents(
  after: String
  dataConfiguration: String
  filter: RecommendedEventsFilter
  first: Int
  sort: RecommendedEventsSort
) -> RecommendedEventsConnection
```
Search events using only location.

### recommendedGroups
```graphql
recommendedGroups(
  after: String
  excludeGroupsWithDues: Boolean
  excludeJoinedGroups: Boolean
  filter: RecommendedGroupsFilter
  first: Int
  ignoreNewGroups: Boolean
) -> RecommendedGroupsConnection
```

### self
```graphql
self -> Member
```
The currently authenticated member.

### events
```graphql
events(where: EventSearch!) -> [Event]!
```

### suggestTopics
```graphql
suggestTopics(
  after: String
  excludeMemberTopics: Boolean
  first: Int
  query: String
) -> TopicsConnection
```

### topicCategories
```graphql
topicCategories(includeNewGroups: Boolean) -> TopicCategoryConnection
```

---

## Mutations

### createEvent
```graphql
createEvent(input: CreateEventInput!) -> CreateEventPayload
```
Create a new event.

### editEvent
```graphql
editEvent(input: EditEventInput!) -> EditEventPayload
```
Edit an existing event.

### deleteEvent
```graphql
deleteEvent(input: DeleteEventInput!) -> DeleteEventPayload
```
Delete an event.

### announceEvent
```graphql
announceEvent(input: AnnounceEventInput!) -> AnnounceEventPayload
```
Send announcement to group members about an event.

### closeEventRsvps
```graphql
closeEventRsvps(input: CloseEventRsvpsInput!) -> CloseEventRsvpsPayload
```
Close RSVPs for an event.

### openEventRsvps
```graphql
openEventRsvps(input: OpenEventRsvpsInput!) -> OpenEventRsvpsPayload
```
Open RSVPs for an event.

### publishEventDraft
```graphql
publishEventDraft(input: PublishEventDraftInput!) -> PublishEventDraftPayload
```
Publish a draft event.

### createVenue
```graphql
createVenue(input: CreateVenueInput!) -> CreateVenuePayload
```
Create a new venue.

### createGroupEventPhoto
```graphql
createGroupEventPhoto(input: GroupEventPhotoCreateInput!) -> CreateGroupEventPhotoPayload
```
Upload a photo to a group album. Returns an `uploadUrl` to PUT the image binary to.

### updateGroup
```graphql
updateGroup(chapterId: ID, input: GroupMutation!) -> Group
```
Update group fields (description, settings, etc).

### updateGroupMembershipRole
```graphql
updateGroupMembershipRole(input: UpdateGroupMembershipRoleInput!) -> UpdateGroupMembershipRolePayload
```
Promote/demote a member's role in the group.

### createGroupDraft / updateGroupDraft / deleteGroupDraft / publishGroupDraft
Group draft lifecycle mutations.

### addGroupToNetwork
```graphql
addGroupToNetwork(input: AddGroupToNetworkInput!) -> AddGroupToNetworkPayload
```

---

## Types

### Group
| Field | Type | Args | Description |
|-------|------|------|-------------|
| id | ID | | |
| name | String | | |
| urlname | String | | |
| link | String | | |
| description | String | | |
| city | String | | |
| state | String | | |
| country | String | | |
| zip | String | | |
| lat | Float | | |
| lon | Float | | |
| timezone | String | | |
| foundedDate | DateTime | | |
| status | GroupStatus | | |
| joinMode | GroupJoinMode | | |
| isPrivate | Boolean | | |
| isMember | Boolean | | |
| isPrimaryOrganizer | Boolean | | |
| organizer | Member | | Primary organizer |
| events | GroupEventConnection | `after: String, filter: GroupEventFilter, first: Int, sort: SortOrder, status: EventStatus` | Filterable event list |
| memberships | GroupMemberConnection | `after: String, filter: MembershipFilter, first: Int, sort: GroupMembershipSort` | Member list |
| venues | GroupVenueConnection | `after: String, first: Int` | Saved venues |
| stats | GroupStats | | |
| groupAnalytics | GroupAnalytics | | |
| duesSettings | DuesSettings | | Paid membership config |
| membershipMetadata | Membership | | Current user's membership |
| featuredEventPhotos | FeaturedEventPhotoConnection | `first: Int` | |
| keyGroupPhoto | PhotoInfo | | |
| socialNetworks | [SocialNetwork]! | | |
| sponsors | ProGroupSponsorsConnection | `after: String, filter: SponsorsFilter, first: Int` | |
| questions | [Question]! | | Membership questions |
| video | GroupVideo | | |
| welcomeBlurb | String | | |
| customMemberLabel | String | | |
| allowMemberPhotoUploads | Boolean | | |
| canAddPhotos | Boolean | | |
| needsPhoto | Boolean | | |
| needsQuestions | Boolean | | |
| emailAnnounceAddress | String | | |
| activeTopics | [Topic]! | | |
| topicCategory | TopicCategory | | |
| proNetwork | ProNetwork | `filter: ProNetworkFilter` | |
| proJoinDate | DateTime | | |

### Event
| Field | Type | Args | Description |
|-------|------|------|-------------|
| id | ID | | |
| title | String | | |
| description | String | | |
| eventUrl | String | | |
| dateTime | DateTime | | Start time |
| endTime | DateTime | | |
| duration | Duration | | |
| createdTime | DateTime | | |
| status | EventStatus | | |
| eventType | EventType | | online, inPerson, hybrid |
| venue | Venue | | |
| venues | [Venue] | | |
| group | Group | | |
| eventHosts | EventHost | | |
| rsvps | RsvpConnection | `after: String, filter: RsvpFilter, first: Int, sort: RsvpSort` | RSVP list |
| rsvpSearch | RsvpSearchConnection | `after: String, filter: RsvpSearchFilter, first: Int` | Search RSVPs |
| hostRsvps | HostRsvpConnection | `after: String, first: Int` | |
| rsvp | Rsvp | | Current user's RSVP |
| rsvpState | RsvpState | | |
| rsvpSettings | RsvpOpenSettings | | |
| rsvpQuestions | [Question]! | | |
| rsvpSurveySettings | RsvpSurveySettings | `newSurvey: Boolean` | |
| comments | EventCommentConnection | `after: String, first: Int, sortOrder: SortOrder` | |
| featuredEventPhoto | PhotoInfo | | |
| displayPhoto | PhotoInfo | | |
| photoAlbum | EventPhotoAlbum | | |
| feeSettings | EventFeeSettings | | Ticket pricing |
| series | Series | | Recurring event info |
| speakerDetails | SpeakerDetails | | |
| networkEvent | NetworkEvent | | |
| howToFindUs | String | | |
| guestsAllowed | Boolean | | |
| guestLimit | Int | | |
| numberOfAllowedGuests | Int | | |
| maxTickets | Int | | |
| waitlistMode | WaitlistMode | | |
| isAttending | Boolean | | |
| isSaved | Boolean | | |
| token | ID | | |
| topics | TopicsConnection | | |
| zoomMeetingId | ID | | |

### Group.events filter
The `events` field on Group accepts a `status` arg with these values:
- `UPCOMING`
- `PAST`
- `DRAFT`
- `CANCELLED`

And a `sort` arg: `ASC` or `DESC`

### Venue
| Field | Type |
|-------|------|
| id | ID |
| name | String |
| address | String |
| city | String |
| state | String |
| country | String |
| zip | String |
| lat | Float |
| lon | Float |

### Member
| Field | Type |
|-------|------|
| id | ID |
| name | String |
| email | String |
| bio | String |
| city | String |
| country | String |
| lat | Float |
| lon | Float |
| memberPhoto | PhotoInfo |
| memberUrl | String |
| gender | String |

### PhotoInfo
| Field | Type |
|-------|------|
| id | ID |
| baseUrl | String |
| highResUrl | String |
| source | String |

---

## Key Field Changes (Legacy -> Current API)

| Old Field | New Field |
|-----------|-----------|
| `api.meetup.com/gql` | `api.meetup.com/gql-ext` |
| `upcomingEvents` | `events(status: UPCOMING)` |
| `pastEvents` | `events(status: PAST)` |
| `draftEvents` | `events(status: DRAFT)` |
| `memberships.count` | `memberships.totalCount` |
| `going` | `rsvps.totalCount` |
| `image` / `images` | `featuredEventPhoto` (use `highResUrl`, `baseUrl` is a broken placeholder) |
| `isOnline` | `eventType` (ONLINE, IN_PERSON, HYBRID) |
| `MEETUP_API_TOKEN` | `MEETUP_OAUTH_TOKEN` + `MEETUP_OAUTH_REFRESH_TOKEN` |

---

## Auth Flow

1. OAuth tokens obtained via authorization code grant at `https://secure.meetup.com/oauth2/access`
2. Access tokens expire — refresh via `grant_type=refresh_token` to same endpoint
3. Requires: `MEETUP_CLIENT_ID`, `MEETUP_CLIENT_SECRET`, `MEETUP_OAUTH_REFRESH_TOKEN`
4. Callback route: `/api/callback/meetup`

## Rate Limits

500 query points per 60 seconds.
