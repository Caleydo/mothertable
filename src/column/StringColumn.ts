import {AVectorColumn, IStringVector} from './AVectorColumn';
import {EOrientation} from './AColumn';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class StringColumn extends AVectorColumn<string, IStringVector> {
  readonly node: HTMLElement;

  minimumWidth: number = 80;
  preferredWidth: number = 300;

  constructor(data: IStringVector, orientation: EOrientation, parent: HTMLElement) {
    super(data, orientation);
    this.node = this.build(parent);
  }

}
