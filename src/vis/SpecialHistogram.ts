/**
 * Created by Martin Ennemoser on 23.05.2017.
 */


import {IVisInstanceOptions} from 'phovea_core/src/vis';
import Histogram, {IHistogramOptions} from 'phovea_vis/src/distribution/Histogram';
import {IStratification} from 'phovea_core/src/stratification';
import {
  IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc,
} from 'phovea_core/src/datatype';
import * as d3 from 'd3';
/**
 * Switches to a mosaic representation if only one bin is present
 */

export class SpecialHistogram extends Histogram {

  constructor(public readonly data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification, parent: Element, options: IHistogramOptions = {}) {
    super(data, parent, options);

  }
  protected build($parent: d3.Selection<any>) {
   const $svg = super.build($parent);
    this.data.hist(Math.floor(this.options.nbins)).then((hist) => {
      const arr : number[] = [];

      let foundNonZero = false;
      hist.forEach(function(value, index) {
        if(value > 0) {
          if(foundNonZero) {
            return;
          }
          foundNonZero = true;
        }
      });
      if(foundNonZero) {
        this.buildAsMosaic();
      }
    });
    return $svg;
  }

  private buildAsMosaic() {

  }
}

export default SpecialHistogram;

export function create(data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>, parent: Element, options?: IHistogramOptions) {
  return new SpecialHistogram(data, parent, options);
}

