/**
 * Created by Martin Ennemoser on 23.05.2017.
 */


import {IVisInstanceOptions} from 'phovea_core/src/vis';
import Histogram, {IHistogramOptions} from 'phovea_vis/src/distribution/Histogram';
import {IStratification} from 'phovea_core/src/stratification';
import {
  IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc,
} from 'phovea_core/src/datatype';

export interface ILabelOptions extends IVisInstanceOptions {
  /**
   * width
   * @default 200
   */
  width?: number;

  /**
   * scale such that the height matches the argument
   * @default 100
   */
  heightTo?: number;
}

/**
 * Switches to a mosaic representation if only one bin is present
 */
export class SpecialHistogram extends Histogram {

  constructor(public readonly data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification, parent: Element, options: ILabelOptions = {}) {
    super(data, parent, options);

  }
  protected build($parent: d3.Selection<any>) {
    const size = this.size,
      data = this.data,
      o = this.options;

    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-histogram'
    });

    return $svg;
  }

}

export default SpecialHistogram;

export function create(data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>, parent: Element, options?: IHistogramOptions) {
  return new SpecialHistogram(data, parent, options);
}

