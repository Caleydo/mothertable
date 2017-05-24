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

export class OneBinHistogram extends Histogram {

  constructor(public readonly data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification, parent: Element, options: IHistogramOptions = {}) {
    super(data, parent, options);

  }
  protected build($svg: d3.Selection<any>) {
    this.data.hist(Math.floor(this.options.nbins)).then((hist) => {
      let nonZeroBins = 0;
      hist.forEach(function(value, index) {
        if(value > 0) {
          nonZeroBins++;
        }
      });
      if(nonZeroBins === 1) {
        this.buildAsMosaic($svg);
      }
      else {
        super.build($svg);
      }
    });
    return $svg;
  }

  private buildAsMosaic($svg) {
    const size = this.size;
    $svg.attr('class', 'mycoolclass');
    $svg.html(`<text  y="15">${this.data.length} ${'sdfjdds'}</text>`);
    this.markReady();
    return null;

  }
}

export default OneBinHistogram;

export function create(data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>, parent: Element, options?: IHistogramOptions) {
  return new OneBinHistogram(data, parent, options);
}

