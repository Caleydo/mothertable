/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return System.import('./src/extension_impl'); }, {});
  // generator-phovea:begin
  registry.push('vis', 'taggle-vis-label', function () {
    return System.import('./src/vis/LabelVis');
  }, {
    name: 'LabelVis',
    filter: 'vector'
  });
  registry.push('vis', 'taggle-vis-onebin-histogram', function () {
    return System.import('./src/vis/OneBinHistogram');
  }, {
    name: 'Histogram',
    icon: function() { return System.import('./src/assets/distribution_histogram_icon.png'); },
    filter: 'vector'
  });
  // generator-phovea:end
};

