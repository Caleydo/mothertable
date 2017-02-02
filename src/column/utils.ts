/**
 * Created by Samuel Gratzl on 31.01.2017.
 */

import {MultiForm} from 'phovea_core/src/multiform';
import {ZoomLogic} from 'phovea_core/src/behavior';
import {EOrientation} from './AColumn';


export function scaleTo(multiform: MultiForm, width: number, height: number, orientation: EOrientation) {
  const zoom = new ZoomLogic(multiform, multiform.asMetaData);
  zoom.zoomTo(width, height);

  // TODO orientation
}
