import { gql } from "@apollo/client";

const allUsersQuery = gql`
  query allUser($email: String) {
    getdashboarddetails(email: $email) {
      user_email
      username
    }
  }
`;

const userDetailsQuery = gql`
  query userDetails($user_email: String) {
    getprofile(user_email: $user_email) {
      user_email
      username
    }
  }
`;

const fetchBillsQuery = gql`
  query fetchBills($group: String) {
    fetchBills(group: $group) {
      created_by
      bill_amount
      bill_group
    }
  }
`;

const ActivityQuery = gql`
  query Activity($email: String) {
    Activity(email: $email) {
      created_by
      bill_amount
    }
  }
`;
const getInvitesQuery = gql`
  query getInvites($email: String) {
    getInvites(email: $email) {
      group_list
    }
  }
`;

export {
  allUsersQuery,
  userDetailsQuery,
  fetchBillsQuery,
  ActivityQuery,
  getInvitesQuery,
};
