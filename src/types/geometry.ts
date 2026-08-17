import type { Edge } from "./placement.js";

export interface Point {
  x: number;
  y: number;
}

export interface TravelPath {
  start: Point;
  end: Point;
}

export interface MeasureTravelInput {
  stage: HTMLElement;
  wrap: HTMLElement;
  card: HTMLElement;
  slot: HTMLElement;
  from: Edge;
}
