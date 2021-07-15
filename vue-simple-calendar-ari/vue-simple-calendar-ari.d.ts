import { DefineComponent, Plugin } from 'vue';

declare const VueSimpleCalendarAri: DefineComponent<{}, {}, any> & { install: Exclude<Plugin['install'], undefined> };
export default VueSimpleCalendarAri;
