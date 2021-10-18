class Path {
  constructor(basePathName?: string) {
    this.segments = basePathName ? [basePathName] : [];

    return this;
  }

  segments: (string | number)[];

  type: 'object' | 'array' | 'normal' = 'normal';

  concat(next: Path) {
    this.segments = this.segments.concat(next.segments);
  }
}

// TODO 暂不需要

export default Path;
