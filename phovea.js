/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return System.import('./src/extension_impl'); }, {});
  // generator-phovea:begin

  registry.push('vis', 'table', function () {
    return System.import('./src/vis/table');
  }, {
    name: 'Table',
    filter: '(matrix|table|vector)',
    sizeDependsOnDataDimension: true

  });

  registry.push('vis', 'barplot', function () {
    return System.import('./src/vis/barplot');
  }, {
    name: 'Bar Plot',
    icon: function() { return System.import('./src/vis/barplot_icon.png'); },
    sizeDependsOnDataDimension: [
      false,
      true
    ],
    filter: [
      'vector',
      '(real|int)'
    ]

  });


  // generator-phovea:end
};

