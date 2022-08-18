const util = require("util");
const bluebird = require("bluebird");
const _ = require("lodash");
const {
  repoQuery,
  topicsQuery,
  assigneesQuery,
  issuesQuery,
  labelsQuery,
  issueCommentsQuery,
  pullRequestsQuery,
  pullRequestsReviewsQuery,
  pullRequestsReviewThreadsQuery,
  pullRequestsReviewCommentsQuery,
} = require("./queries");

async function downloadRepo(client, account, repo, pageSize) {
  try {
    const { repository } = await client(repoQuery(account, repo, pageSize));
    return repository;
  } catch (err) {
    console.log("Error caught and rethrown in downloadRepo():", err.message);
    throw err;
  }
}

async function downloadTopics(client, account, repo, pageSize, preFetched) {
  try {
    let topics = preFetched.edges.map((edge) => edge.node.topic.name);
    let finished = !preFetched.pageInfo.hasNextPage;
    let after = `, after: "${preFetched.pageInfo.endCursor}"`;
    while (!finished) {
      const { repository } = await client(
        topicsQuery(account, repo, pageSize, after)
      );
      topics = topics.concat(
        repository.repositoryTopics.edges.map((edge) => edge.node.topic.name)
      );
      if (!repository.repositoryTopics.pageInfo.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${repository.repositoryTopics.pageInfo.endCursor}"`;
      }
    }
    return topics;
  } catch (err) {
    console.log("Error caught and rethrown in downloadTopics():", err.message);
    throw err;
  }
}

async function downloadIssues(spinner, total, client, account, repo, pageSize) {
  try {
    let issues = [];
    let finished = false;
    let after = "";
    // TODO(kyrcha): Optimization - Seldect in the query the first assignees and labels since usually the are 0, 1 or 2.
    while (!finished) {
      const { repository } = await client(
        issuesQuery(account, repo, pageSize, after)
      );
      let currentIssues = repository.issues.edges.map((edge) => edge.node);
      currentIssues = await bluebird.mapSeries(
        currentIssues,
        async function (issue, index, arrayLength) {
          // The iteration will be performed sequentially, awaiting for any
          // promises in the process.
          const assignees = await downloadAssignees(
            client,
            issue.id,
            "Issue",
            pageSize,
            issue.assignees
          );
          issue.assignees = assignees;
          return issue;
        }
      );
      currentIssues = await bluebird.mapSeries(
        currentIssues,
        async function (issue, index, arrayLength) {
          const labels = await downloadLabels(
            client,
            issue.id,
            "Issue",
            pageSize,
            issue.labels
          );
          issue.labels = labels;
          return issue;
        }
      );
      currentIssues = await bluebird.mapSeries(
        currentIssues,
        async function (issue, index, arrayLength) {
          const comments = await downloadIssueComments(
            client,
            issue.id,
            "Issue",
            pageSize,
            issue.comments
          );
          issue.comments = comments;
          return issue;
        }
      );
      issues = issues.concat(currentIssues);
      spinner.text = `Retrieving Issues ${issues.length}/${total}`;
      if (!repository.issues.pageInfo.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${repository.issues.pageInfo.endCursor}"`;
      }
    }
    return issues;
  } catch (err) {
    console.log("Error caught and rethrown in downloadIssues():", err.message);
    throw err;
  }
}

async function downloadAssignees(client, id, entity, pageSize, preFetched) {
  try {
    let assignees = preFetched.edges.map((edge) => edge.node.login);
    let finished = !preFetched.pageInfo.hasNextPage;
    let after = `, after: "${preFetched.pageInfo.endCursor}"`;
    while (!finished) {
      const { node } = await client(
        assigneesQuery(id, entity, pageSize, after)
      );
      assignees = assignees.concat(
        node.assignees.nodes.map((node) => node.login)
      );
      if (!node.assignees.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${node.assignees.endCursor}"`;
      }
    }
    return assignees;
  } catch (err) {
    console.log(
      "Error caught and rethrown in downloadAssignees():",
      err.message
    );
    throw err;
  }
}

async function downloadLabels(client, id, entity, pageSize, preFetched) {
  try {
    let labels = preFetched.edges.map((edge) => edge.node.description);
    let finished = !preFetched.pageInfo.hasNextPage;
    let after = `, after: "${preFetched.pageInfo.endCursor}"`;
    while (!finished) {
      const { node } = await client(labelsQuery(id, entity, pageSize, after));
      labels = labels.concat(node.labels.nodes.map((node) => node.description));
      if (!node.labels.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${node.labels.endCursor}"`;
      }
    }
    return labels;
  } catch (err) {
    console.log("Error caught and rethrown in downloadLabels():", err.message);
    throw err;
  }
}

async function downloadIssueComments(client, id, entity, pageSize, preFetched) {
  try {
    let comments = preFetched.edges.map((edge) => edge.node);
    let finished = !preFetched.pageInfo.hasNextPage;
    let after = `, after: "${preFetched.pageInfo.endCursor}"`;
    while (!finished) {
      const { node } = await client(
        issueCommentsQuery(id, entity, pageSize, after)
      );
      comments = comments.concat(node.comments.edges.map((edge) => edge.node));
      if (!node.comments.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${node.comments.endCursor}"`;
      }
    }
    return comments;
  } catch (err) {
    console.log(`On id: ${id}`);
    console.log(
      "Error caught and rethrown in downloadIssueComments():",
      err.message
    );
    throw err;
  }
}

async function downloadPullRequests(
  spinner,
  total,
  client,
  account,
  repo,
  pageSize
) {
  try {
    let prs = [];
    let finished = false;
    let after = "";
    // TODO(kyrcha): Optimization - Seldect in the query the first assignees and labels since usually the are 0, 1 or 2.
    while (!finished) {
      const { repository } = await client(
        pullRequestsQuery(account, repo, pageSize, after)
      );
      let currentPRs = repository.pullRequests.edges.map((edge) => edge.node);
      currentPRs = await bluebird.mapSeries(
        currentPRs,
        async function (pr, index, arrayLength) {
          const assignees = await downloadAssignees(
            client,
            pr.id,
            "PullRequest",
            pageSize,
            pr.assignees
          );
          pr.assignees = assignees;
          return pr;
        }
      );
      currentPRs = await bluebird.mapSeries(
        currentPRs,
        async function (pr, index, arrayLength) {
          const labels = await downloadLabels(
            client,
            pr.id,
            "PullRequest",
            pageSize,
            pr.labels
          );
          pr.labels = labels;
          return pr;
        }
      );
      currentPRs = await bluebird.mapSeries(
        currentPRs,
        async function (pr, index, arrayLength) {
          const comments = await downloadIssueComments(
            client,
            pr.id,
            "PullRequest",
            pageSize,
            pr.comments
          );
          pr.comments = comments;
          return pr;
        }
      );
      currentPRs = await bluebird.mapSeries(
        currentPRs,
        async function (pr, index, arrayLength) {
          const reviews = await downloadPullRequestReviews(
            client,
            pr,
            pageSize,
            pr.reviews
          );
          pr.reviews = reviews;
          return pr;
        }
      );
      prs = prs.concat(currentPRs);
      spinner.text = `Retrieving PRs ${prs.length}/${total}`;
      if (!repository.pullRequests.pageInfo.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${repository.pullRequests.pageInfo.endCursor}"`;
      }
    }
    return prs;
  } catch (err) {
    console.log(
      "Error caught and rethrown in downloadPullRequests():",
      err.message
    );
    throw err;
  }
}

async function downloadPullRequestReviews(client, pr, pageSize, preFetched) {
  try {
    let reviews = preFetched.edges.map((edge) => edge.node);
    let finished = !preFetched.pageInfo.hasNextPage;
    let after = `, after: "${preFetched.pageInfo.endCursor}"`;
    while (!finished) {
      const { node } = await client(
        pullRequestsReviewsQuery(pr.id, pageSize, after)
      );
      let currentPRReviews = node.reviews.edges.map((edge) => edge.node);
      currentPRReviews = await bluebird.mapSeries(
        currentPRReviews,
        async function (review, index, arrayLength) {
          const comments = await downloadPullRequestReviewThreads(
            client,
            pr.id,
            pageSize,
            pr.reviewThreads
          ); // need the id of the PR not the PR review
          review.comments = comments;
          return review;
        }
      );
      reviews = reviews.concat(currentPRReviews);
      if (!node.reviews.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${node.reviews.endCursor}"`;
      }
    }
    return reviews;
  } catch (err) {
    console.log(
      "Error caught and rethrown in downloadPullRequestReviews():",
      err.message
    );
    throw err;
  }
}

// https://github.community/t5/GitHub-API-Development-and/Bug-v4-GraphQL-API-Trouble-retrieving-pull-request-review/td-p/17524
async function downloadPullRequestReviewThreads(
  client,
  id,
  pageSize,
  preFetched
) {
  try {
    let threads = preFetched.edges.map((edge) => edge.node);
    let finished = !preFetched.pageInfo.hasNextPage;
    let after = `, after: "${preFetched.pageInfo.endCursor}"`;
    while (!finished) {
      const { node } = await client(
        pullRequestsReviewThreadsQuery(id, pageSize, after)
      );
      let currentPRThreads = node.reviewThreads.edges.map((edge) => edge.node);
      currentPRThreads = await bluebird.mapSeries(
        currentPRThreads,
        async function (thread, index, arrayLength) {
          const comments = await downloadPullRequestReviewComments(
            client,
            thread.id,
            pageSize,
            thread.comments
          );
          thread.comments = comments;
          return thread;
        }
      );
      threads = threads.concat(currentPRThreads);
      if (!node.reviewThreads.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${node.reviewThreads.endCursor}"`;
      }
    }
    return _.chain(threads)
      .map((thread) => thread.comments)
      .flatten()
      .value();
  } catch (err) {
    console.log(
      "Error caught and rethrown in downloadPullRequestReviewThreads():",
      err.message
    );
    throw err;
  }
}

async function downloadPullRequestReviewComments(
  client,
  threadId,
  pageSize,
  preFetched
) {
  try {
    let comments = preFetched.edges.map((edge) => edge.node);
    let finished = !preFetched.pageInfo.hasNextPage;
    let after = `, after: "${preFetched.pageInfo.endCursor}"`;
    while (!finished) {
      const { node } = await client(
        pullRequestsReviewCommentsQuery(threadId, pageSize, after)
      );
      comments = comments.concat(node.comments.edges.map((edge) => edge.node));
      if (!node.comments.hasNextPage) {
        finished = true;
      } else {
        after = `, after: "${node.comments.endCursor}"`;
      }
    }
    return comments;
  } catch (err) {
    console.log(
      "Error caught and rethrown in downloadPullRequestReviewComments():",
      err.message
    );
    throw err;
  }
}

module.exports.downloadRepo = downloadRepo;
module.exports.downloadTopics = downloadTopics;
module.exports.downloadIssues = downloadIssues;
module.exports.downloadPullRequests = downloadPullRequests;
