/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorColumn, IStringVector} from './AVectorColumn';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import VisManager from './VisManager';
import {EAggregationType} from './VisManager';


export default class StringColumn extends AVectorColumn<string, IStringVector> {
  minWidth: number = 20;
  maxWidth: number = 100;
  minHeight: number = 19;
  maxHeight: number = 20;

  constructor(data: IStringVector, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
  }

  protected multiFormParams($body: d3.Selection<any>): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, EAggregationType.UNAGGREGATED),
      'list': {
        cssClass: 'taggle-vis-list'
      }, all: {
        heightTo: this.orientation === EOrientation.Horizontal ? 50 : $body.property('clientHeight'),
      }
    });
  }

}
