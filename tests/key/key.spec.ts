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
      "91ca6a724408ee9b5dc7330702ebb8339f7b95c5041a546b2241bce05b640d",
    );
  });

  test("should grind key properly", () => {
    const privateKey =
      "86F3E7293141F20A8BAFF320E8EE4ACCB9D4A4BF2B4D295E8CEE784DB46E0519";
    expect(grindKey(privateKey)).toEqual(
      "4ce0449029ab7c90751ab97ec4455e56d613d91a257d685690b08661e90742e",
    );
  });

  test("should format properly", () => {
    const cases = [
      {
        key: "2afa023647c36b81ec17fc65a40e7128e3b35f73160b0e6af556e56462d8e9f6",
        expected:
          562819399746207251456275138853779458015718802238235240199147763678013522260n,
      },
      {
        key: "a35108aab8124f9d9b1e7bd189b9597b8b395ae08fb32e699ffadc6393c38dd",
        expected:
          2251360863138910982837482474475732139690137621654118073641459798203325289282n,
      },
      {
        key: "8999b15057be9f6795b1d0173767f0461f005f74cd4ff0b76fe048c466ba93f",
        expected:
          1378163257968653930934421443084452812931513765409736498480718644817816039836n,
      },
      {
        key: "96ac2b6cf209c45c08db814ee7da057c8f202f0617d4e586dc068ec0e364fe6",
        expected:
          363403267051194786011840151033172177340276279399811917547493656482083944494n,
      },
      {
        key: "1985dae39164491bd204d4a9cbc62ab9eba86ed39b6bbdaef3bfe127cdb06eb1",
        expected:
          15051249265343618915963526035669618006668271974583265058485211008350106498n,
      },
      {
        key: "1bc49a5200f567bfef899fd80c3e270ffb9f59080b3c3a4645964edbf138482a",
        expected:
          1303315087559454946140704034226035912273541005657154649676335641893443800467n,
      },
      {
        key: "2975701a88cde504aee6035dcaaac49140313c1ba0a2674ab18b10b7408d796b",
        expected:
          756693823331632350278266745349677231011647139794278936419567477479087495572n,
      },
      {
        key: "1f7eeeba1377bc8b2503ad7a5ffc236abb6e47a02ff741191382ee1030f355b4",
        expected:
          883819333892438195859758072403020907470858159083943612960781033746446903601n,
      },
      {
        key: "17329b80ffded7e6e35bb4c2ab70403182e7292effc45f129bb2063f4c29b44f",
        expected:
          117313854455302692794087655431185841270406506657336760098943409039983351377n,
      },
      {
        key: "26db27487610f636e083787bb4f3fa44e2ef72ceb65e55d8ede2af7a6e02447e",
        expected:
          92974264327138352764575613047875025406190364360867062485410497190823574791n,
      },
    ];

    for (const { key, expected } of cases) {
      const formatted = formatKeyForCurve(key);
      expect(formatted.toString()).toEqual(expected.toString());
    }
  });
});
