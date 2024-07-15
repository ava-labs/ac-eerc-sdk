import { SNARK_FIELD_SIZE } from "../utils";
import { FF } from "./ff";
import { Scalar } from "./scalar";
import type { Point } from "./types";

export class BabyJub {
  public field: FF;
  public A: bigint;
  public D: bigint;

  public Generator: Point = [
    5299619240641551281634865583518297030282874472190772894086521144482721001553n,
    16950150798460657717958625567821834550301663161624707787222815936182638968203n,
  ];

  constructor() {
    this.field = new FF(SNARK_FIELD_SIZE);
    this.A = 168700n;
    this.D = 168696n;
  }

  // adds two points on the curve
  addPoints(p1: Point, p2: Point): Point {
    const beta = this.field.mul(p1[0], p2[1]);
    const gamma = this.field.mul(p1[1], p2[0]);
    const delta = this.field.mul(
      this.field.sub(p1[1], this.field.mul(this.A, p1[0])),
      this.field.add(p2[0], p2[1]),
    );
    const tau = this.field.mul(beta, gamma);
    const dtau = this.field.mul(this.D, tau);

    const x = this.field.div(
      this.field.add(beta, gamma),
      this.field.add(this.field.one, dtau),
    );

    const y = this.field.div(
      this.field.add(
        delta,
        this.field.sub(this.field.mul(this.A, beta), gamma),
      ),
      this.field.sub(this.field.one, dtau),
    );
    return [x, y] as Point;
  }

  // subtract points on the curve
  // p1 - p2 = p1 + (-p2) (additive inverse)
  subPoints(p1: Point, p2: Point): Point {
    const negatedP2: Point = [this.field.negate(p2[0]), p2[1]];
    return this.addPoints(p1, negatedP2);
  }

  // multiplies a point by a scalar
  mulWithScalar(p: Point, s: bigint): Point {
    let res = [this.field.zero, this.field.one] as Point;
    let e = p;
    let rem = s;
    while (!Scalar.isZero(rem)) {
      if (Scalar.isOdd(rem)) {
        res = this.addPoints(res, e);
      }
      e = this.addPoints(e, e);
      rem = Scalar.shiftRight(rem, 1);
    }
    return res;
  }

  // implements the equation of the curve
  // y^2 = x^3 + A*x^2 + x
  // returns true if the point is on the curve
  inCurve(p: Point): boolean {
    const x2 = this.field.mul(p[0], p[0]);
    const y2 = this.field.mul(p[1], p[1]);
    return this.field.eq(
      this.field.add(this.field.mul(this.A, x2), y2),
      this.field.add(
        this.field.one,
        this.field.mul(this.D, this.field.mul(x2, y2)),
      ),
    );
  }
}
