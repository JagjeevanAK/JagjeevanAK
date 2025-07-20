import { gql } from 'graphql-request';

// Query to get GitHub contribution data for the contribution calendar/heatmap
export const GetGithubContributions = gql`
  query GetGithubContributions($userName: String!) {
    user(login: $userName) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(first: 1, orderBy: {field: PUSHED_AT, direction: DESC}) {
        nodes {
          pushedAt
        }
      }
    }
  }
`;

// Query to get repository information including last update time
export const GetRepoInfo = gql`
  query GetRepoInfo($username: String!, $repositoryName: String!) {
    repository(owner: $username, name: $repositoryName) {
      pushedAt
    }
  }
`;