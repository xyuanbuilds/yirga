const uuid = () => {
  return String(
    Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * 10 ** 6),
  );
};

export { uuid };

export function swap(arr, cur, target) {
  const curLineArr = Object.entries(arr[cur]);
  const targetLineArr = Object.entries(arr[target]);

  const swapLines = curLineArr.reduce((pre, i, curIndex) => {
    const key = i[0];
    if (key !== 'key' && key !== 'index') {
      pre.push(curIndex);
    }
    return pre;
  }, [] as number[]);

  swapLines.forEach((i) => {
    const tmp1 = curLineArr[i][1];
    const tmp2 = targetLineArr[i][1];
    curLineArr[i][1] = tmp2;
    targetLineArr[i][1] = tmp1;
  });
  arr[cur] = Object.fromEntries(curLineArr);
  arr[target] = Object.fromEntries(targetLineArr);
  return arr;
}

export function drop(willDrop: any[]) {
  return willDrop.map((item) => {
    const tmpMap = Object.entries(item).map((i) => {
      const key: string = i[0];
      const content: any = i[1];
      const tmp: any[] = [];

      if (key === 'key' || key === 'index') {
        tmp[0] = key;
        tmp[1] = Number(content) - 1;
      } else {
        const keyBreak = key.split('_');
        tmp[0] = `${Number(keyBreak[0]) - 1}_${keyBreak[1]}`;
        tmp[1] = content;
      }
      return tmp;
    });
    return Object.fromEntries(tmpMap);
  });
}

export function dropMultiple(curDataSource, index) {
  const keep = curDataSource.slice(0, index);
  const willDrop = curDataSource.slice(index + 1, curDataSource.length);
  return keep.concat(drop(willDrop));
}

type SimilarObject = string | number | {} | null;
export function isSimilar(source: SimilarObject, target: SimilarObject) {
  if (source === target) {
    return true;
  }

  if ((!source && target) || (source && !target)) {
    return false;
  }

  if (
    !source ||
    !target ||
    typeof source !== 'object' ||
    typeof target !== 'object'
  ) {
    return false;
  }

  const sourceKeys = Object.keys(source);
  const targetKeys = Object.keys(target);
  const keys = new Set([...sourceKeys, ...targetKeys]);

  return [...keys].every((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      typeof sourceValue === 'function' &&
      typeof targetValue === 'function'
    ) {
      return true;
    }
    return sourceValue === targetValue;
  });
}
