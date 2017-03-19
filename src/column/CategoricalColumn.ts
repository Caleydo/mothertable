/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AVectorColumn from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import VisManager from './VisManager';

export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {

  minWidth: number = 2;
  maxWidth: number = 200; //80
  minHeight: number = 2;
  maxHeight: number = 10;
  static readonly EVENT_STRATIFYME = 'stratifyByMe';

  constructor(data: ICategoricalVector, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
    this.attachListener();
  }

  protected multiFormParams($body: d3.Selection<any>): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type),
    });
  }


  private attachListener() {
    const that = this;
    this.toolbar.insert('button', ':first-child')
      .classed('fa fa-bars', true)
      .on('click', () => {
        this.fire(CategoricalColumn.EVENT_STRATIFYME, this.data.desc.id);
      })


  }

}
