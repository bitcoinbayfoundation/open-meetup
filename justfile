# Build the CLI
build:
    pnpm --filter @bitcoinbay/open-meetup build

# Start dev server
dev:
    pnpm --filter template dev

# Build and publish CLI to npm
publish:
    just build
    cd packages/cli && npm publish --access public

# Version bump, build, and publish (patch/minor/major)
bump version='patch':
    cd packages/cli && npm version {{version}}
    just publish
