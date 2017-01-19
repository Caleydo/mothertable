/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import IDType from 'phovea_core/src/idtype/IDType';
import {IDataType} from 'phovea_core/src/datatype';


abstract class AFilter<T, DATATYPE extends IDataType> {
  constructor(public readonly data: DATATYPE) {

  }

  get idType() {
    return this.data.idtypes[0];
  }

  abstract readonly node: HTMLElement;

  /**
   * filter the given value
   * @param value
   */
  abstract filter(value: T): boolean;

  /**
   * is a filter set
   */
  abstract isFiltered(): boolean;
}

export default AFilter;
