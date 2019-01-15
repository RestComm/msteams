import { gql } from 'apollo-boost';

export const RegisterMemberGQL = gql`
  mutation registerMember($member: MSTeamRegister) {
    registerMember(member: $member) {
      result
      desc
    }
  }
`;

export const QueryMemberDetailsGQL = gql`
  query getMemberById($teamId: String!) {
    getMemberById(teamId: $teamId) {
      teamId
      teamName
      channelId
      channelName
      phoneNumber
    }
  }
`;
