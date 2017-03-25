/**
 * Created by bikramkawan on 23/03/2017.
 */
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {IDataType} from 'phovea_core/src/datatype';
import {IMultiFormOptions} from 'phovea_core/src/multiform/IMultiForm';

export default class TaggleMultiform extends MultiForm {
  public groupId: number = NaN;
  public brushed: boolean = false;

  constructor(public readonly data: IDataType, parent: HTMLElement, public options: IMultiFormOptions = {}) {
    super(data, parent, options);
  }


}
