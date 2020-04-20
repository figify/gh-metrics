module.exports = {
  repoQuery: function (account, repo, pageSize) {
    return `{
            repository(owner: "${account}", name: "${repo}") {
              mergeCommitAllowed
              rebaseMergeAllowed
              squashMergeAllowed
              isArchived
              createdAt
              defaultBranchRef {
                name
              }
              description
              isDisabled
              isFork
              forkCount
              nameWithOwner
              hasIssuesEnabled
              hasWikiEnabled
              homepageUrl
              url
              databaseId
              primaryLanguage {
                name
              }
              name
              id
              openIssues: issues(states: OPEN) {
                totalCount
              }
              issues {
                totalCount
              }
              openPRs: pullRequests(states: OPEN) {
                totalCount
              }
              pullRequests {
                totalCount
              }
              owner {
                login
                __typename
                ... on Organization {
                  id
                  databaseId
                }
                ... on User {
                  id
                  databaseId
                }
              }
              isPrivate
              pushedAt
              sshUrl
              stargazers {
                totalCount
              }
              updatedAt
              watchers {
                totalCount
              }
              repositoryTopics(first: ${pageSize}) {
                edges {
                  node {
                    topic {
                      name
                    }
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }
        `;
  },
  topicsQuery: function (account, repo, pageSize, after) {
    return `{
            repository(owner: "${account}", name: "${repo}") {
              repositoryTopics(first: ${pageSize}${after}) {
                edges {
                  node {
                    topic {
                      name
                    }
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }`;
  },
  issuesQuery: function (account, repo, pageSize, after) {
    return `{
            repository(owner: "${account}", name: "${repo}") {
              issues(first: ${pageSize}${after}) {
                edges {
                  node {
                    body
                    closedAt
                    createdAt
                    url
                    databaseId
                    locked
                    milestone {
                      id
                      title
                    }
                    id
                    number
                    state
                    title
                    updatedAt
                    author {
                      login
                      __typename
                      ... on User {
                        databaseId
                        id
                        login
                      }
                    }
                    timelineItems(last:1, itemTypes:CLOSED_EVENT){
                      edges {
                        node {
                          ... on ClosedEvent {
                            actor {
                              login
                            }
                          }
                        }
                      }
                    }
                    assignees(first: ${pageSize}) {
                      edges {
                        node {
                          login
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                    labels(first: ${pageSize}) {
                      edges {
                        node {
                          description
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                    comments(first: ${pageSize}) {
                      edges {
                        node {
                          authorAssociation
                          body
                          createdAt
                          url
                          databaseId
                          id
                          updatedAt
                          author {
                            login
                            __typename
                            ... on User {
                              databaseId
                              id
                              login
                            }
                          }
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }`;
  },
  assigneesQuery: function (id, entity, pageSize, after) {
    return `{
            node(id: "${id}") {
              ... on ${entity} {
                assignees(first: ${pageSize}${after}) {
                  nodes {
                    login
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }
          `;
  },
  labelsQuery: function (id, entity, pageSize, after) {
    return `{
            node(id: "${id}") {
              ... on ${entity} {
                labels(first: ${pageSize}${after}) {
                  nodes {
                    description
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }`;
  },
  issueCommentsQuery: function (id, entity, pageSize, after) {
    return `{
            node(id: "${id}") {
              ... on ${entity} {
                comments(first: ${pageSize}${after}) {
                  edges {
                    node {
                      authorAssociation
                      body
                      createdAt
                      url
                      databaseId
                      id
                      updatedAt
                      author {
                        login
                        __typename
                        ... on User {
                          databaseId
                          id
                          login
                        }
                      }
                    }
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }
          `;
  },
  pullRequestsQuery: function (account, repo, pageSize, after) {
    return `{
            repository(owner: "${account}", name: "${repo}") {
              pullRequests(first: ${pageSize}${after}) {
                edges {
                  node {
                    additions
                    authorAssociation
                    baseRef {
                      id
                    }
                    body
                    changedFiles
                    closedAt
                    commits {
                      totalCount
                    }
                    createdAt
                    deletions
                    headRef {
                      id
                    }
                    url
                    databaseId
                    maintainerCanModify
                    mergeCommit {
                      oid
                    }
                    mergeable
                    merged
                    mergedAt
                    mergedBy {
                      login
                    }
                    milestone {
                      id
                      title
                    }
                    id
                    number
                    countReviewThreads: reviewThreads {
                      totalCount
                    }
                    state
                    title
                    updatedAt
                    author {
                      login
                      __typename
                      ... on User {
                        databaseId
                        id
                        login
                      }
                    }
                    assignees(first: ${pageSize}) {
                      edges {
                        node {
                          login
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                    labels(first: ${pageSize}) {
                      edges {
                        node {
                          description
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                    comments(first: ${pageSize}) {
                      edges {
                        node {
                          authorAssociation
                          body
                          createdAt
                          url
                          databaseId
                          id
                          updatedAt
                          author {
                            login
                            __typename
                            ... on User {
                              databaseId
                              id
                              login
                            }
                          }
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                    reviews(first: ${pageSize}) {
                      edges {
                        node {
                          body
                          url
                          databaseId
                          id
                          state
                          submittedAt
                          author {
                            login
                            __typename
                            ... on User {
                              databaseId
                              id
                              login
                            }
                          }
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                    reviewThreads(first: ${pageSize}) {
                      edges {
                        node {
                          id
                        }
                      }
                      pageInfo {
                        endCursor
                        hasNextPage
                      }
                    }
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }`;
  },
  pullRequestsReviewsQuery: function (id, pageSize, after) {
    return `{
            node(id: "${id}") {
              ... on PullRequest {
                reviews(first: ${pageSize}${after}) {
                  edges {
                    node {
                      body
                      url
                      databaseId
                      id
                      state
                      submittedAt
                      author {
                        login
                        __typename
                        ... on User {
                          databaseId
                          id
                          login
                        }
                      }
                    }
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }`;
  },
  pullRequestsReviewThreadsQuery: function (id, pageSize, after) {
    return `{
            node(id: "${id}") {
              ... on PullRequest {
                reviewThreads(first: ${pageSize}${after}) {
                  edges {
                    node {
                      id
                      comments(first: ${pageSize}) {
                        edges {
                          node {
                            authorAssociation
                            body
                            commit {
                              oid
                            }
                            createdAt
                            diffHunk
                            url
                            databaseId
                            id
                            originalCommit {
                              oid
                            }
                            originalPosition
                            path
                            position
                            updatedAt
                            author {
                              login
                              __typename
                              ... on User {
                                databaseId
                                id
                                login
                              }
                            }
                          }
                        }
                        pageInfo {
                          endCursor
                          hasNextPage
                        }
                      }
                    }
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }`;
  },
  pullRequestsReviewCommentsQuery: function (id, pageSize, after) {
    return `{
            node(id: "${id}") {
              ... on PullRequestReviewThread {
                comments(first: ${pageSize}${after}) {
                  edges {
                    node {
                      authorAssociation
                      body
                      commit {
                        oid
                      }
                      createdAt
                      diffHunk
                      url
                      databaseId
                      id
                      originalCommit {
                        oid
                      }
                      originalPosition
                      path
                      position
                      updatedAt
                      author {
                        login
                        __typename
                        ... on User {
                          databaseId
                          id
                          login
                        }
                      }
                    }
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }
          `;
  },
};
