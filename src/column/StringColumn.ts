import {AVectorColumn, IStringVector} from './AVectorColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class StringColumn extends AVectorColumn<string, IStringVector> {
  readonly node: HTMLElement;

  constructor(data: IStringVector, columnParent: HTMLElement) {
    super(data);
    this.node = this.build(columnParent);
  }
}
