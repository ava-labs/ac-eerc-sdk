export const SNARK_FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export const MESSAGES = {
  REGISTER: (user: string, contract: string) =>
    `AvaCloud\nRegistering user with\n Address:${user.toLowerCase()}\nContract Address: ${contract.toLowerCase()}`,
};
