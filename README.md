# gh-metrics

> A command line tool that calculates pull-request and issue metrics given a GitHub repository

## Usage

Example for a dependency used:

`GITHUB_TOKEN=<yout-token> npx @figify/gh-metrics --a sindresorhus --r ora`

## Maintainer

[Kyriakos Chatzidimitriou](http://kyrcha.info)

## Roadmap

- Do the calculations in memory instead of storing in memory everything
- Store in csv files option
- Option to calculate only issues or only PR metrics
- Create a mini-site

## Contributing

## Publishing guide

Example because I am forgetfull:

- `git tag -a v0.1.0 -m "Version 0.1.0 - First working version"`
- `git push origin v0.1.0`
-  `npm publish --access public --dry-run`

## License

[MIT](LICENSE)
