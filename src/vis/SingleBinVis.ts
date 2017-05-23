/**
 * Created by Martin on 23.05.2017.
 */

import {LabelVis} from './LabelVis';
import {ILabelOptions} from './LabelVis';
import {IAnyVector} from 'phovea_core/src/vector';

export class SingleBinVis extends LabelVis {
  constructor(public readonly data: IAnyVector, parent: HTMLElement, options: ILabelOptions = {}) {
    super(data, parent, options);
  }
}
