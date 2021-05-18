import { gql } from "@apollo/client";

const loginQuery = gql`
  mutation Login($email: String, $password: String) {
    Login(email: $email, password: $password) {
      user_email
    }
  }
`;

const signupQuery = gql`
  mutation Signup($username: String, $user_email: String, $password: String) {
    Signup(email: $user_email, password: $password, username: $username) {
      message
    }
  }
`;

const dashboardQuery = gql`
  mutation dashboard($email: String) {
    dashboard(email: $email) {
      message
    }
  }
`;

const AllMembersQuery = gql`
  mutation AllMembers($groupname: String) {
    AllMembers(groupname: $email) {
      user_email
    }
  }
`;

const AddBillQuery = gql`
  mutation AddBill($username: String, $user_email: String, $password: String) {
    AddBill(email: $email, password: $password, fullname: $fullname) {
      message
    }
  }
`;

const createGroupQuery = gql`
  mutation Signup($username: String, $user_email: String, $password: String) {
    Signup(email: $email, password: $password, fullname: $fullname) {
      message
    }
  }
`;

const acceptInvitesQuery = gql`
  mutation Signup(
    $user: String
    $billData: String
    $amount: Int
    $group: String
    $members: List
  ) {
    Signup(
      user: $user
      billData: $billData
      amount: $amount
      group: $group
      members: $members
    ) {
      message
    }
  }
`;

const leaveGroupQuery = gql`
  mutation Signup($user: String, $group: String) {
    Signup(user: $user, group: $group) {
      message
    }
  }
`;

const AmountQuery = gql`
  mutation amount($user: String) {
    amount(user: $user) {
      email
      amt
    }
  }
`;

export {
  loginQuery,
  signupQuery,
  dashboardQuery,
  AllMembersQuery,
  AddBillQuery,
  createGroupQuery,
  acceptInvitesQuery,
  leaveGroupQuery,
  AmountQuery,
};
