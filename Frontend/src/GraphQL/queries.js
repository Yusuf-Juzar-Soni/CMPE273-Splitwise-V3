import { gql } from "@apollo/client";

const dashboardQuery = gql`
  query getdashboarddetails($email: String) {
    getdashboarddetails(email: $email) {
      user_1
      user_2
      final_amount
      group_name
    }
  }
`;

const profileQuery = gql`
  query getprofile($email: String) {
    getprofile(email: $email) {
      email
      fullname
      language
      currency
      phonenumber
      timezone
      photopath
    }
  }
`;

// # query{
//     #   userDetails(user_email:"abc@gmail.com"){
//     #     username
//     #     user_email
//     #   }
//     # }

//     # query{
//     #   allUsers(email:"abc@gmail.com"){
//     #     username
//     #     user_email
//     #   }
//     # }

//     # query{
//     #   fetchBills(group:"APT 309"){
//     #     created_by
//     #     bill_amount

//     #   }
//     # }
//     # query{
//     #   Activity(email:"mg@gmail.com"){
//     #     created_by
//     #     bill_amount

//     #   }
//     # }
//     # query{
//     #   getInvites(email:"mg@gmail.com"){

//     #     group_list

//     #   }
//     # }

export { dashboardQuery, profileQuery };
