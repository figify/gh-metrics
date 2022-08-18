#!/usr/bin/env node
// 👆 Used to tell Node.js that this is a CLI tool

const argv = require("yargs").argv;
const chalk = require("chalk");
const downloaders = require("./downloaders");
const { graphql } = require("@octokit/graphql");
const util = require("util");
const _ = require("lodash");
const ora = require("ora");
const prettyMilliseconds = require("pretty-ms");

const log = console.log;

function checks() {
  if (!argv.r) {
    log(chalk.red("The repository argument (--r) was not set"));
    process.exit(-1);
  }

  if (!argv.a) {
    log(
      chalk.red("The account (user or organization) argument (--a) was not set")
    );
    process.exit(-1);
  }

  if (!process.env.GITHUB_TOKEN) {
    log(chalk.red("GITHUB_TOKEN not set"));
    process.exit(-1);
  }
}

checks();
const account = argv.a;
const repo = argv.r;
const ghUrl = process.env.GITHUB_URL;
const ghToken = process.env.GITHUB_TOKEN;
const millisToHours = 1000 * 60 * 60;
const millisToDays = millisToHours * 24;
const pageSize = 50;
const smallPageSize = 50;

let graphqlOpts = {
  headers: {
    authorization: `token ${ghToken}`,
  },
};

if (ghUrl) graphqlOpts = { ...graphqlOpts, baseUrl: `${ghUrl}` };

const graphqlWithAuth = graphql.defaults(graphqlOpts);

let spinner = ora(
  `Start gathering data for ${chalk.green(account + "/" + repo)}`
).start();

(async () => {
  try {
    var start = new Date();
    var repository = await downloaders.downloadRepo(
      graphqlWithAuth,
      account,
      repo,
      pageSize
    );
    const totalIssues = repository.issues.totalCount;
    const totalPRs = repository.pullRequests.totalCount;
    var topics = await downloaders.downloadTopics(
      graphqlWithAuth,
      account,
      repo,
      pageSize,
      repository.repositoryTopics
    );
    spinner = spinner.succeed(
      `Repository metadata retrieved! Topics: ${
        topics.length > 0 ? topics.join(",") : "No topics defined :("
      }`
    );
    spinner.start();
    spinner.text = `Retrieving Issues 0/${totalIssues}`;
    var issues = await downloaders.downloadIssues(
      spinner,
      totalIssues,
      graphqlWithAuth,
      account,
      repo,
      pageSize
    );
    spinner = spinner.succeed(`${issues.length} issues retrieved!`);
    spinner.text = `Retrieving PRs 0/${totalPRs}`;
    spinner.start();
    var pullRequests = await downloaders.downloadPullRequests(
      spinner,
      totalPRs,
      graphqlWithAuth,
      account,
      repo,
      smallPageSize
    );
    spinner = spinner.succeed(`${pullRequests.length} PRs retrieved!`);

    // Start analyzing
    // Repo
    log(chalk.white("===== Analysis ====="));
    log(
      chalk.whiteBright(
        `Stars: ${repository.stargazers.totalCount} | Forks: ${repository.forkCount} | Watchers: ${repository.watchers.totalCount}`
      )
    );
    // Issues
    const open = _.filter(issues, (issue) => issue.state === "OPEN").length;
    log(chalk.greenBright(`${issues.length} issues retrieved!`));
    log(chalk.greenBright(`Open Issues: ${open}`));
    log(chalk.greenBright(`Closed Issues: ${issues.length - open}`));
    const timeToClose = _.chain(issues)
      .filter((issue) => issue.state === "CLOSED")
      .meanBy(
        (issue) => Date.parse(issue.closedAt) - Date.parse(issue.createdAt)
      )
      .value();
    if (!isNaN(timeToClose)) {
      log(
        chalk.greenBright(
          `Average Time to Close: ${prettyMilliseconds(
            timeToClose
          )} (does not account for issues closed and re-opened)`
        )
      );
    }
    // TODO(kyrcha): Average number of assignees per issue
    // TODO(kyrcha): Average number of labels per issue
    const avgCommentsPerIssue = _.meanBy(
      issues,
      (issue) => issue.comments.length
    );
    // check if NaN
    if (!isNaN(avgCommentsPerIssue)) {
      log(
        chalk.greenBright(
          `Average Comments per Issue: ${avgCommentsPerIssue.toFixed(2)}`
        )
      );
    }

    // PRs
    log(chalk.green(`${pullRequests.length} pull requests retrieved!`));
    const openPRs = _.filter(
      pullRequests,
      (pullRequest) => pullRequest.state === "OPEN"
    ).length;
    log(chalk.green(`Open PRs: ${openPRs}`));
    const closedPRs = _.filter(
      pullRequests,
      (pullRequest) => pullRequest.state === "CLOSED"
    ).length;
    log(chalk.green(`Closed PRs: ${closedPRs}`));
    const mergedPRs = _.filter(
      pullRequests,
      (pullRequest) => pullRequest.state === "MERGED"
    ).length;
    log(chalk.green(`Merged PRs: ${mergedPRs}`));
    const timeToMerge = _.chain(pullRequests)
      .filter((pr) => pr.state === "MERGED")
      .meanBy((pr) => Date.parse(pr.mergedAt) - Date.parse(pr.createdAt))
      .value();
    log(
      chalk.green(`Average Time to Merge: ${prettyMilliseconds(timeToMerge)}`)
    );
    const avgCommentsPerPR = _.meanBy(pullRequests, (pr) => pr.comments.length);
    log(chalk.green(`Average Comments per PR: ${avgCommentsPerPR.toFixed(2)}`));
    const avgCommentsPerPRClosedMerged = _.chain(pullRequests)
      .filter((pr) => pr.state === "MERGED" || pr.state === "CLOSED")
      .meanBy((pr) => pr.comments.length)
      .value();
    log(
      chalk.green(
        `Average Comments per PR (Closed or Merged): ${avgCommentsPerPRClosedMerged.toFixed(
          2
        )}`
      )
    );
    const avgReviewsPerPRClosedMerged = _.chain(pullRequests)
      .filter((pr) => pr.state === "MERGED" || pr.state === "CLOSED")
      .meanBy((pr) => pr.reviews.length)
      .value();
    log(
      chalk.green(
        `Average Reviews per PR (Closed or Merged): ${avgReviewsPerPRClosedMerged.toFixed(
          2
        )}`
      )
    );
    const avgInteractionsPerPRClosedMerged = _.chain(pullRequests)
      .filter((pr) => pr.state === "MERGED" || pr.state === "CLOSED")
      .meanBy(
        (pr) =>
          pr.reviews.length +
          pr.comments.length +
          _.chain(pr.reviews)
            .map((review) => review.comments)
            .flatten()
            .value().length
      )
      .value();
    log(
      chalk.green(
        `Average Interactions (comments, reviews, review comments) per PR (Closed or Merged): ${avgInteractionsPerPRClosedMerged.toFixed(
          2
        )}`
      )
    );
    var end = new Date() - start;
    log(`Retrieval and calculation time: ${prettyMilliseconds(end)}`);
    process.exit(0);
  } catch (err) {
    spinner.fail("Retriever broke...");
    log(chalk.red(err.stack));
    process.exit(1);
  }
})();
