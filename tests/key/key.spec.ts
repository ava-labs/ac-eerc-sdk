import {
  formatKeyForCurve,
  getPrivateKeyFromSignature,
  grindKey,
} from "../../src/crypto/key";

describe("Key Derivation", () => {
  test("should derive private decryption key from eth signature properly", () => {
    const signature =
      "0x21fbf0696d5e0aa2ef41a2b4ffb623bcaf070461d61cf7251c74161f82fec3a43" +
      "70854bc0a34b3ab487c1bc021cd318c734c51ae29374f2beb0e6f2dd49b4bf41c";

    expect(getPrivateKeyFromSignature(signature)).toEqual(
      "69e5438ce6a3cf3d267cfe9d73316c4426574409cc107e2c1fa6c34cb8efa0c",
    );
  });

  test("should grind key properly", () => {
    const privateKey =
      "86F3E7293141F20A8BAFF320E8EE4ACCB9D4A4BF2B4D295E8CEE784DB46E0519";
    expect(grindKey(privateKey)).toEqual(
      "1d002b82733387dde379ce732d0502147de3ff6525778e32f63afa72b5277f00",
    );
  });

  test("should format properly", () => {
    const cases = [
      {
        key: "2afa023647c36b81ec17fc65a40e7128e3b35f73160b0e6af556e56462d8e9f6",
        expected:
          6034880117706026057017876575168098230169346746555369758599579085574908268342n,
      },
      {
        key: "a35108aab8124f9d9b1e7bd189b9597b8b395ae08fb32e699ffadc6393c38dd",
        expected:
          4987391222118820385618283192632891525766951593812685332841675459151772662323n,
      },
      {
        key: "8999b15057be9f6795b1d0173767f0461f005f74cd4ff0b76fe048c466ba93f",
        expected:
          4114193616948563333715222161241612199008327737568303757680934305766263412877n,
      },
      {
        key: "96ac2b6cf209c45c08db814ee7da057c8f202f0617d4e586dc068ec0e364fe6",
        expected:
          5835463985011013591573441587347490949493904223716946435947924978378978690576n,
      },
      {
        key: "1985dae39164491bd204d4a9cbc62ab9eba86ed39b6bbdaef3bfe127cdb06eb1",
        expected:
          5487111967225162424477564962349988390160296216291717783458916532905244852580n,
      },
      {
        key: "1bc49a5200f567bfef899fd80c3e270ffb9f59080b3c3a4645964edbf138482a",
        expected:
          6775375805519273751702305470540354684427168949974289168076766963790338546549n,
      },
      {
        key: "2975701a88cde504aee6035dcaaac49140313c1ba0a2674ab18b10b7408d796b",
        expected:
          6228754541291451155839868181663996003165275084111413454819998799375982241654n,
      },
      {
        key: "1f7eeeba1377bc8b2503ad7a5ffc236abb6e47a02ff741191382ee1030f355b4",
        expected:
          6355880051852257001421359508717339679624486103401078131361212355643341649683n,
      },
      {
        key: "17329b80ffded7e6e35bb4c2ab70403182e7292effc45f129bb2063f4c29b44f",
        expected:
          5589374572415121498355689091745504613424034450974471278499374730936878097459n,
      },
      {
        key: "26db27487610f636e083787bb4f3fa44e2ef72ceb65e55d8ede2af7a6e02447e",
        expected:
          5565034982286957158326177049362193797559818308678001580885841819087718320873n,
      },
    ];

    for (const { key, expected } of cases) {
      const formatted = formatKeyForCurve(key);
      expect(formatted).toEqual(expected);
    }
  });
});
