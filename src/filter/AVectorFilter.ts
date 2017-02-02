/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AFilter from './AFilter';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc} from 'phovea_core/src/datatype';

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorFilter<T, DATATYPE extends IVector<T, any>> extends AFilter<T, DATATYPE> {

}

export default AVectorFilter;
