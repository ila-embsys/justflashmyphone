# justflashmyphone

The UI for just dropping partition images into a phone

## Building

Just running `make` command in the project root dir should be enough to get bundle in `dist` folder

## Developing

While invoking `make` internally calls a sequence like `make configure` then `make build`,
the configure step can be omitted just by running `make build` if once configure step was finished.

The sequence `make clean` then `make build` expected to be a little faster.
Also, the only specific target can be cleaned like `make clean-libusb`.

## Debugging

1. Run the app by `yarn start` (the app must be built before by `make build`)
2. Launch Chrome or Chromium with arguments `--remote-debugging-port=9222 http://localhost:3000`
3. Attach to run browser by launching the 'Attach Chrome' launch target
