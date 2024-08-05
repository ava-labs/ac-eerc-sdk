export const SNARK_FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
export const SHA_256_MAX_DIGEST =
  115792089237316195423570985008687907853269984665640564039457584007913129639936n;

export const MESSAGES = {
  REGISTER: (user: string, contract: string) =>
    `AvaCloud\nRegistering user with\n Address:${user.toLowerCase()}\nContract Address: ${contract.toLowerCase()}`,
};

// !IMPORTANT: This is a placeholder URL
// leaving this as is for now, but it should be updated to the actual URL
export const LOOKUP_TABLE_URL = "http://127.0.0.1:5500/lookup_table.json";
