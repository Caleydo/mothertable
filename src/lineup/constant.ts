/**
 * Created by Samuel Gratzl on 25.04.2017.
 */

import {IAnyVector, IVectorDataDescription} from 'phovea_core/src/vector';
import {IAnyMatrix, IMatrixDataDescription} from 'phovea_core/src/matrix';

export declare type ITaggleDataType = IAnyVector|IAnyMatrix;

export declare type ITaggleDataDescription = IVectorDataDescription<any> | IMatrixDataDescription<any>;
