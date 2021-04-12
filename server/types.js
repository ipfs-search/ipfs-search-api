const indexes = [
  'ipfs_directories_v8',
  'ipfs_files_v8',
];

const types = [
  'directory',
  'file',
];

module.exports = {
  typeFromIndex: (index) => {
    const indexOfIndex = indexes.indexOf(index);

    if (indexOfIndex === -1) {
      throw new Error(`Unknown index: ${index}`);
    }

    return types[indexOfIndex];
  },
  indexesFromType: (type) => {
    if (!type || type === 'any') {
      return indexes;
    }

    const indexOfType = types.indexOf(type);
    if (indexOfType === -1) {
      throw new Error(`Unknown type: ${type}`);
    }

    return [indexes[indexOfType]];
  },
};
