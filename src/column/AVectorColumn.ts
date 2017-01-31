import AColumn from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc} from 'phovea_core/src/datatype';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  constructor(data: DATATYPE) {
    super(data);
  }
}

export default AVectorColumn;
