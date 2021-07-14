<template>
	<div
		aria-label="Calendar"
		:class="[
			'cv-wrapper',
			'locale-' + CalendarMath.languageCode(displayLocale),
			'locale-' + displayLocale,
			'y' + periodStart.getFullYear(),
			'm' + CalendarMath.paddedMonth(periodStart),
			'period-' + displayPeriodUom,
			'periodCount-' + displayPeriodCount,
			{
				past: CalendarMath.isPastMonth(periodStart),
				future: CalendarMath.isFutureMonth(periodStart),
				noIntl: !CalendarMath.supportsIntl,
			},
		]"
	>	
		<slot :header-props="headerProps" name="header" />
		<div class="cv-header-days">
			<div class="cv-weeknumber first-col">
				<span >部屋</span>
			</div>
			<template v-for="(day, index) in CalendarMath.daysOfWeek(this.periodStart)">
				<slot :index="getColumnDOWClass(index)" :label="day" name="dayHeader">
					<div :key="getColumnDOWClass(index)" :class="[getColumnDOWClass(index), CalendarMath.isSameDate(day, CalendarMath.today()) ? 'cv-today' :'']" class="cv-header-day">
						{{ day.getDate() }}
					</div>
				</slot>
			</template>
		</div>
		
		<div :aria-multiselectable="enableDateSelection" class="cv-weeks">
			<div
				v-for="roomNo in rooms"
				:key="`${roomNo}-week`"
				:class="['cv-week', 'week' + (roomNo), 'ws' + CalendarMath.isoYearMonthDay(this.periodStart)]"
			>
				<div class="cv-weeknumber first-col" >
					<slot name="weekNumber" :date="this.periodStart" :numberInPeriod="roomNo"
						><span >{{ roomNo }}</span></slot
					>
				</div>
				<div class="cv-weekdays">
					<div
						v-for="(day, dayIndex) in CalendarMath.daysOfWeek(this.periodStart)"
						:key="getColumnDOWClass(dayIndex)"
						:draggable="enableDateSelection"
						:class="[
							'cv-day ',
							getColumnDOWClass(dayIndex),
							'd' + CalendarMath.isoYearMonthDay(day),
							'd' + CalendarMath.isoMonthDay(day),
							'd' + CalendarMath.paddedDay(day),
							'R' + roomNo,
							
							'instance' + CalendarMath.instanceOfMonth(day),
							{
								today: CalendarMath.isSameDate(day, CalendarMath.today()),
								outsideOfMonth: !CalendarMath.isSameMonth(day, defaultedShowDate),
								past: CalendarMath.isInPast(day),
								future: CalendarMath.isInFuture(day),
								last: CalendarMath.isLastDayOfMonth(day),
								lastInstance: CalendarMath.isLastInstanceOfMonth(day),
								hasItems: dayHasItems(day),
								selectionStart: CalendarMath.isSameDate(day, selectionStart),
								selectionEnd: CalendarMath.isSameDate(day, selectionEnd),
							},
							...((dateClasses && dateClasses[CalendarMath.isoYearMonthDay(day)]) || []),
						]"
						:aria-grabbed="enableDateSelection ? dayIsSelected(day) : 'undefined'"
						:aria-label="day.getDate()"
						:aria-selected="dayIsSelected(day)"
						:aria-dropeffect="enableDragDrop && currentDragItem ? 'move' : enableDateSelection && dateSelectionOrigin ? 'execute' : 'none'"
						@click="onClickDay(day, $event, roomNo)"
						@dragstart="onDragDateStart(day, $event)"
						@drop.prevent="onDrop(day, $event, roomNo)"
						@dragover.prevent="onDragOver(day, $event)"
						@dragenter.prevent="onDragEnter(day, $event)"
						@dragleave.prevent="onDragLeave(day, $event)"
					>
						<div class="cv-day-number"></div><!--{{ day.getDate() }}-->
						<slot :day="day" name="dayContent" /><!--Ямар хэрэгтэй билээ-->
					</div>
					<template v-for="i in getWeekItems(this.periodStart, roomNo)">
						<slot :value="i" :weekStartDate="this.periodStart" :top="getItemTop(i)" name="item">
							<div
								:key="i.id"
								:draggable="enableDragDrop"
								:aria-grabbed="enableDragDrop ? i == currentDragItem : 'undefined'"
								:class="i.classes"
								:roomNo = i.roomNo
								:title="i.title"
								:style="`top:${getItemTop(i)};${i.originalItem.style}`"
								class="cv-item"
								@dragstart="onDragItemStart(i, $event)"
								@mouseenter="onMouseEnterItem(i, $event)"
								@mouseleave="onMouseLeaveItem(i, $event)"
								@click.stop="onClickItem(i, $event)"
								v-html="getItemTitle(i)"
							/>
						</slot>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import CalendarMath from "./CalendarMath"
import CalendarViewState from "./CalendarViewState"

import { defineComponent, PropType } from "vue"
import { ICalendarItem, INormalizedCalendarItem, DateTimeFormatOption } from "./ICalendarItem"
import { IHeaderProps } from "./IHeaderProps"

export default defineComponent({
	name: "CalendarView",

	props: {
		showDate: { type: Date, default: undefined },
		displayPeriodUom: { type: String, default: "month" },
		displayPeriodCount: { type: Number, default: 1 },
		displayWeekNumbers: { type: Boolean, default: true },
		locale: { type: String, default: undefined },
		monthNameFormat: { type: String as PropType<DateTimeFormatOption>, default: "long" },
		weekdayNameFormat: { type: String as PropType<DateTimeFormatOption>, default: "short" },
		showTimes: { type: Boolean, default: false },
		timeFormatOptions: { type: Object, default: () => {} },
		disablePast: { type: Boolean, default: false },
		disableFuture: { type: Boolean, default: false },
		enableDateSelection: { type: Boolean, default: false },
		selectionStart: { type: Date, default: null },
		selectionEnd: { type: Date, default: null },
		enableDragDrop: { type: Boolean, default: false },
		startingDayOfWeek: { type: Number, default: 0 },
		items: { type: Array as () => Array<ICalendarItem>, default: () => [] },
		dateClasses: { type: Object, default: () => {} },
		itemTop: { type: String, default: "1.4em" },
		itemContentHeight: { type: String, default: "1.4em" },
		itemBorderHeight: { type: String, default: "2px" },
		periodChangedCallback: { type: Function, default: undefined },
		currentPeriodLabel: { type: String, default: "" },
		currentPeriodLabelIcons: { type: String, default: "⇤-⇥" },
		doEmitItemMouseEvents: { type: Boolean, default: false },
	},

	emits: [
		"input",
		"period-changed",
		"click-date",
		"click-item",
		"item-mouseenter",
		"item-mouseleave",
		"drag-start",
		"drag-over-date",
		"drag-enter-date",
		"drag-leave-date",
		"drop-on-date",
		"date-selection",
		"date-selection-start",
		"date-selection-finish",
	],

	data: () => new CalendarViewState(),

	computed: {
		/*
		Props cannot default to computed/method returns, so create defaulted version of this
		property and use it rather than the bare prop (Vue Issue #6013).
		*/
		displayLocale(): string {
			return this.locale || CalendarMath.getDefaultBrowserLocale()
		},

		/*
		ShowDate, but defaulted to today. Needed both for periodStart below and for the
		"outside of month" class. Any time component passed as part of showDate is discarded.
		*/
		defaultedShowDate(): Date {
			if (this.showDate) return CalendarMath.dateOnly(this.showDate)
			return CalendarMath.today()
		},

		/*
		Given the showDate, defaulted to today, computes the beginning and end of the period
		that the date falls within.
		*/
		periodStart(): Date {
			return CalendarMath.beginningOfPeriod(this.defaultedShowDate, this.displayPeriodUom, this.startingDayOfWeek)
		},

		periodEnd(): Date {
			return CalendarMath.addDays(CalendarMath.incrementPeriod(this.periodStart, this.displayPeriodUom, this.displayPeriodCount), -1)
		},

		periodStartCalendarWeek(): number {
			const firstWeekStarts = CalendarMath.beginningOfWeek(CalendarMath.beginningOfPeriod(this.periodStart, "year", 0), this.startingDayOfWeek)
			const periodWeekStarts = CalendarMath.beginningOfWeek(this.periodStart, this.startingDayOfWeek)
			return 1 + Math.floor(CalendarMath.dayDiff(firstWeekStarts, periodWeekStarts) / 7)
		},

		/*
		For month and year views, the first and last dates displayed in the grid may not
		be the same as the intended period, since the period may not start and stop evenly
		on the starting day of the week.
		*/
		displayFirstDate(): Date {
			return CalendarMath.beginningOfWeek(this.periodStart, this.startingDayOfWeek)
		},

		displayLastDate(): Date {
			console.log("displayLastDate")
			console.log(this.periodEnd)
			console.log(this.startingDayOfWeek)

			return CalendarMath.endOfWeek(this.periodEnd, this.startingDayOfWeek)
		},

		/*
		Create an array of dates, where each date represents the beginning of a week that
		should be rendered in the view for the current period.
		*/
		weeksOfPeriod(): Array<Date> {
			// Returns an array of object representing the date of the beginning of each week
			// included in the view.
			const numWeeks = Math.floor((CalendarMath.dayDiff(this.displayFirstDate, this.displayLastDate) + 1) / 15)
			console.log("weeksOfPeriod111")
			console.log(numWeeks)
			console.log(this.displayFirstDate)
			console.log(this.displayLastDate)
			console.log([...Array(numWeeks)].map((_, i) => CalendarMath.addDays(this.displayFirstDate, i * 30)))
			
			return [...Array(numWeeks)].map((_, i) => CalendarMath.addDays(this.displayFirstDate, i * 30))
		},

		rooms(): Array<Number> {
			// Returns an array of object representing the date of the beginning of each week
			// included in the view.
			const numWeeks = Math.floor((CalendarMath.dayDiff(this.displayFirstDate, this.displayLastDate) + 1) / 11)
			console.log("numWeeksss")
			console.log(numWeeks)
			console.log(this.displayFirstDate)
			console.log(this.displayLastDate)
			
			
			return [102,103]
		},

		// Cache the names based on current locale and format settings
		monthNames(): Array<string> {
			return CalendarMath.getFormattedMonthNames(this.displayLocale, this.monthNameFormat)
		},

		weekdayNames(): Array<string> {
			return CalendarMath.getFormattedWeekdayNames(this.displayLocale, this.weekdayNameFormat, this.startingDayOfWeek)
		},

		// Ensure all item properties have suitable default
		fixedItems(): Array<INormalizedCalendarItem> {
			
			const self = this
			console.log("fixedItems")
			console.log(this.items.map((item) => CalendarMath.normalizeItem(item, item.id === self.currentHoveredItemId)))
			if (!this.items) return []
			return this.items.map((item) => CalendarMath.normalizeItem(item, item.id === self.currentHoveredItemId))
		},

		// Period that today's date sits within
		currentPeriodStart(): Date {
			return CalendarMath.beginningOfPeriod(CalendarMath.today(), this.displayPeriodUom, this.startingDayOfWeek)
		},

		currentPeriodEnd(): Date {
			return CalendarMath.addDays(CalendarMath.incrementPeriod(this.currentPeriodStart, this.displayPeriodUom, this.displayPeriodCount), -1)
		},

		// Creates the HTML to render the date range for the calendar header.
		periodLabel(): string {
			return CalendarMath.formattedPeriod(this.periodStart, this.periodEnd, this.displayPeriodUom, this.monthNames)
		},

		currentPeriodLabelFinal(): string {
			const c = this.currentPeriodStart
			const s = this.periodStart
			if (!this.currentPeriodLabel) return CalendarMath.formattedPeriod(c, this.currentPeriodEnd, this.displayPeriodUom, this.monthNames)
			if (this.currentPeriodLabel === "icons") return this.currentPeriodLabelIcons[Math.sign(c.getTime() - s.getTime()) + 1]
			return this.currentPeriodLabel
		},

		headerProps(): IHeaderProps {
			return {
				// Dates for UI navigation
				previousYear: this.getIncrementedPeriod(-12),
				previousPeriod: this.getIncrementedPeriod(-1),
				nextPeriod: this.getIncrementedPeriod(1),
				previousFullPeriod: this.getIncrementedPeriod(-this.displayPeriodCount),
				nextFullPeriod: this.getIncrementedPeriod(this.displayPeriodCount),
				nextYear: this.getIncrementedPeriod(12),
				currentPeriod: this.currentPeriodStart,
				currentPeriodLabel: this.currentPeriodLabelFinal,
				// Dates for header display
				periodStart: this.periodStart,
				periodEnd: this.periodEnd,
				// Extra information that could be useful to a custom header
				displayLocale: this.displayLocale,
				displayFirstDate: this.displayFirstDate,
				displayLastDate: this.displayLastDate,
				monthNames: this.monthNames,
				fixedItems: this.fixedItems,
				periodLabel: this.periodLabel,
			}
		},

		periodRange() {
			return {
				periodStart: this.periodStart,
				periodEnd: this.periodEnd,
				displayFirstDate: this.displayFirstDate,
				displayLastDate: this.displayLastDate,
			}
		},
	},

	watch: {
		periodRange: {
			immediate: true,
			handler(newVal) {
				if (this.periodChangedCallback) {
					this.$emit("period-changed")
					this.periodChangedCallback(newVal, "watch")
				}
			},
		},
	},

	methods: {
		// ******************************
		// UI Events
		// ******************************

		onClickDay(day: Date, windowEvent: Event, roomNo: Number): void {
			console.log("day clicked")
			if (this.disablePast && CalendarMath.isInPast(day)) return
			if (this.disableFuture && CalendarMath.isInFuture(day)) return
			console.log("day clicked2")
			this.$emit("click-date", day, this.findAndSortItemsInDateRange(roomNo, day, day), windowEvent)
		},

		onClickItem(calendarItem: ICalendarItem, windowEvent: Event): void {
			this.$emit("click-item", calendarItem, windowEvent)
		},

		/*
		The day name header needs to know the dow for class assignment, and this value should
		not change based on startingDayOfWeek (i.e., Sunday is always 0). This function
		computes the dow for a given day index.
		*/
		getColumnDOWClass(dayIndex: number): string {
			console.log("what is day index")
			console.log(dayIndex)
			// console.log(weekdayNames)
			return "dow" + ((dayIndex + this.startingDayOfWeek) % 30)
		},

		// ******************************
		// Date Periods
		// ******************************

		/*
		Returns a date for the current display date moved forward or backward by a given
		number of the current display units. Returns null if said move would result in a
		disallowed display period.
		*/
		getIncrementedPeriod(count: number): Date | null {
			const newStartDate = CalendarMath.incrementPeriod(this.periodStart, this.displayPeriodUom, count)
			const newEndDate = CalendarMath.incrementPeriod(newStartDate, this.displayPeriodUom, this.displayPeriodCount)
			console.log("getIncrementedPeriod")
			console.log(newEndDate)
			console.log(newStartDate)
			
			
			if (this.disablePast && newEndDate <= CalendarMath.today()) return null
			if (this.disableFuture && newStartDate > CalendarMath.today()) return null
			return newStartDate
		},

		// ******************************
		// Hover items (#95, #136)
		// ******************************

		onMouseEnterItem(calendarItem: ICalendarItem, windowEvent: Event): void {
			this.currentHoveredItemId = calendarItem.id
			if (this.doEmitItemMouseEvents) {
				this.$emit("item-mouseenter", calendarItem, windowEvent)
			}
		},

		onMouseLeaveItem(calendarItem: ICalendarItem, windowEvent: Event): void {
			this.currentHoveredItemId = ""
			if (this.doEmitItemMouseEvents) {
				this.$emit("item-mouseleave", calendarItem, windowEvent)
			}
		},

		// ******************************
		// Dragging across days (selection)
		// ******************************

		onDragDateStart(day: Date, windowEvent: DragEvent): boolean {
			if (!this.enableDateSelection) return false
			// Push the date where the selection started into dataTransfer. This is not used by this component, but
			// a value required in Firefox and possibly other browsers.
			windowEvent.dataTransfer?.setData("text", day.toString())
			let img = new Image()
			img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
			windowEvent.dataTransfer?.setDragImage(img, 10, 10)
			this.dateSelectionOrigin = day
			this.emitDateSelection("date-selection-start", day, windowEvent)
			return true
		},

		// ******************************
		// Drag and drop items
		// ******************************

		onDragItemStart(calendarItem: INormalizedCalendarItem, windowEvent: DragEvent): boolean {
			if (!this.enableDragDrop) return false

			// Firefox and possibly other browsers require dataTransfer to be set, even if the value is not used. IE11
			// requires that the first argument be exactly "text" (not "text/plain", etc.). The calendar item's ID is
			// passed, allowing calling applications to receive items dragged outside the component.
			windowEvent.dataTransfer?.setData("text", calendarItem.id)
			
				
			// However, we don't use dataTransfer within the component. Instead, we just keep a handled on the item
			// currently being dragged. This avoids having to look it up later.

			this.currentDragItem = calendarItem
			// Reset date selection origin so the onenter events aren't confused
			this.dateSelectionOrigin = null
			// Allow the calling application to add additional functionality.
			this.$emit("drag-start", calendarItem, windowEvent)

			
			return true
		},

		handleDragEvent(bubbleEventName: "drag-over-date" | "drag-enter-date" | "drag-leave-date" | "drop-on-date", bubbleParam: any, windowEvent: Event): boolean {
			console.log("handleDragEvent1")
			if (!this.enableDragDrop) return false
			console.log("handleDragEvent2")
			// If the user drags an item FROM this calendar TO this calendar, currentDragItem will be initialized to the
			// most recent item with a dragStart event. If not, we still emit the event, and the caller will need to
			// determine what to do based on the third argument (windowEvent, which gives them access to `dataTransfer`).
			// This allows developers to create custom calendars where things can be dragged in from the outside. This
			// also allows developers using scoped slots for items to handle the drag and drop themselves.
			this.$emit(bubbleEventName, this.currentDragItem, bubbleParam, windowEvent)
			return true
		},

		handleDropEvent(bubbleEventName: "drop-on-date", bubbleParam: any, windowEvent: Event, room: Number): boolean {
			console.log("handleDropEvent")
			// console.log(this.currentDragItem?.roomNo)
			console.log(room)
			if (!this.enableDragDrop) return false
			console.log("handleDragEvent2")
			if(this.currentDragItem)
				{
					console.log("handleDragEvent2SET")
					this.currentDragItem.roomNo = Number(room)
				}
			// this.currentDragItem?.id = Number(room)
			// If the user drags an item FROM this calendar TO this calendar, currentDragItem will be initialized to the
			// most recent item with a dragStart event. If not, we still emit the event, and the caller will need to
			// determine what to do based on the third argument (windowEvent, which gives them access to `dataTransfer`).
			// This allows developers to create custom calendars where things can be dragged in from the outside. This
			// also allows developers using scoped slots for items to handle the drag and drop themselves.
			
			this.$emit(bubbleEventName, this.currentDragItem, bubbleParam, windowEvent)
			return true
		},

		onDragOver(day: Date, windowEvent: Event): void {
			console.log("onDragOver check")
			this.handleDragEvent("drag-over-date", day, windowEvent)
		},

		onDragEnter(day: Date, windowEvent: Event) {
			console.log("onDragEnter check")
			if (this.enableDateSelection && this.dateSelectionOrigin) {
				// User is selecting dates, not items.
				this.emitDateSelection("date-selection", day, windowEvent)
				return
			}
			console.log("onDragEnter check1")
			if (!this.handleDragEvent("drag-enter-date", day, windowEvent)) return
			console.log("onDragEnter check2")
			
			const el = windowEvent.target as HTMLElement
			console.log(el)
			el.classList.add("draghover")
		},

		onDragLeave(day: Date, windowEvent: Event): void {
			console.log("onDragLeave check")
			// User is selecting dates, not items. No emit.
			if (this.enableDateSelection && this.selectionStart) return
			if (!this.handleDragEvent("drag-leave-date", day, windowEvent)) return
			const el = windowEvent.target as HTMLElement
			el.classList.remove("draghover")
		},

		onDrop(day: Date, windowEvent: Event, roomNo:Number): void {
			console.log("onDrop check roomNo")
			
			if(this.dayHasItemsInNewRange(day, roomNo) == true){
				 console.log("illicit range")
				 const el = windowEvent.target as HTMLElement
				 el.classList.remove("draghover")
				return
			 }

			if (this.enableDateSelection && this.dateSelectionOrigin) {
				console.log("onDrop check1")
				// User is selecting dates, not items.
				console.log("drop returned")
				this.emitDateSelection("date-selection-finish", day, windowEvent)
				return
			}
			console.log("onDrop check2")
			if (!this.handleDropEvent("drop-on-date", day, windowEvent,roomNo)) {
				console.log("drop returned")
				return
			}

 			
			
			const el = windowEvent.target as HTMLElement
			el.classList.remove("draghover")
		},

		emitDateSelection(eventName: "date-selection" | "date-selection-start" | "date-selection-finish", toDate: Date, windowEvent: Event): void {
			console.log("emitDateSelection")
			console.log(this.dateSelectionOrigin)
			console.log(eventName)
			console.log(toDate)
			
			if (!this.dateSelectionOrigin) return
			this.$emit(eventName, toDate <= this.dateSelectionOrigin ? [toDate, this.dateSelectionOrigin, windowEvent] : [this.dateSelectionOrigin, toDate, windowEvent])
		},

		// ******************************
		// Calendar Items
		// ******************************

		itemComparer(a: INormalizedCalendarItem, b: INormalizedCalendarItem) {
			console.log(a.startDate+":ID:"+a.id)
			console.log(b.startDate+":ID:"+b.id)
			if (a.startDate < b.startDate) return -1
			if (b.startDate < a.startDate) return 1
			if (a.endDate > b.endDate) return -1
			if (b.endDate > a.endDate) return 1
			return a.id < b.id ? -1 : 1
		},

		findAndSortItemsInWeek(weekStart: Date, weekIndex: Number): Array<INormalizedCalendarItem> {
			// Return a list of items that INCLUDE any portion of a given week.
			// FIXIN ARI
			let dayCount = Number(CalendarMath.daysCountOfMonth(weekStart))- Number(1)
			console.log("findAndSortItemsInWeek daycount:" + dayCount)
			return this.findAndSortItemsInDateRange(weekIndex, weekStart, CalendarMath.addDays(weekStart, dayCount))
			//old
			// return this.findAndSortItemsInDateRange(weekStart, CalendarMath.addDays(weekStart, 6))
		},

		findAndSortItemsInDateRange(roomNo: Number, startDate: Date, endDate: Date): Array<INormalizedCalendarItem> {
			// Return a list of items that INCLUDE any day within the date range,
			// inclusive, sorted so items that start earlier are returned first.
			console.log("findAndSortItemsInDateRange"+startDate+"enddate:"+endDate)
			console.log("checkRoomNoWithIndex")
			console.log(roomNo)
			return this.fixedItems.filter((item) => item.roomNo == roomNo && item.endDate >= startDate && CalendarMath.dateOnly(item.startDate) <= endDate, this).sort(this.itemComparer)
		},

		dayHasItems(day: Date): boolean {
			return !!this.fixedItems.find((d) => d.endDate >= day && CalendarMath.dateOnly(d.startDate) <= day)
		},

		dayHasItemsInNewRange(startDateNewRange:Date, requestRoomNo: Number): boolean {
			console.log(startDateNewRange)
			const days =  CalendarMath.dayDiff(this.currentDragItem?.startDate as Date, this.currentDragItem?.endDate as Date)
			const endDateNewRange = CalendarMath.addDays(startDateNewRange, days)
			const itemInRange = this.fixedItems.filter((d) => d.id != this.currentDragItem?.id &&  d.roomNo == requestRoomNo)
			console.log("dayHasItemsInNewRange")
			if(itemInRange.filter((d) => endDateNewRange >= new Date(d.startDate.toDateString()) && endDateNewRange <= new Date(d.endDate.toDateString())).length > 0)
				return true;
			if(itemInRange.filter((d) => startDateNewRange >= new Date(d.startDate.toDateString()) && startDateNewRange <= new Date(d.endDate.toDateString())).length > 0)
				return true;
			if(itemInRange.filter((d) => startDateNewRange <= new Date(d.startDate.toDateString()) && endDateNewRange >= new Date(d.startDate.toDateString())).length > 0)
				return true;
			if(itemInRange.filter((d) => startDateNewRange <= new Date(d.endDate.toDateString()) && endDateNewRange >= new Date(d.endDate.toDateString())).length > 0)
				return true;
			return false;
		},

		dayIsSelected(day: Date): boolean {
			console.log("aria selected")
			if (!this.selectionStart || !this.selectionEnd) return false
			if (day < CalendarMath.dateOnly(this.selectionStart)) return false
			if (day > CalendarMath.dateOnly(this.selectionEnd)) return false
			return true
		},

		getWeekItems(weekStart: Date, roomNo: Number): Array<INormalizedCalendarItem> {
			// Return a list of items that CONTAIN the week starting on a day.
			// Sorted so the items that start earlier are always shown first.
			const items = this.findAndSortItemsInWeek(weekStart, roomNo)
			const results = []
			//FIXING ARI
			
			// new
			const daysCountOfMonth = CalendarMath.daysCountOfMonth(weekStart)-1
			// const itemRows: Array<Array<boolean>> = [new Array<boolean>(daysCountOfMonth)]
			// //old
			const itemRows: Array<Array<boolean>> = [[], [], [], [], [], [], [],[], [], [], [], [], [], [],[], [], [], [], [], [], [],[], [], [], [], [], [], [], [], []]
			// const itemRows: Array<Array<boolean>> = [[], [], [], [], [], [], []]
			console.log("getweeksitemsssAAA"+daysCountOfMonth+"d:"+items)
			for (let i = 0; i < items.length; i++) {
				const ep = Object.assign({}, items[i], {
					classes: [...items[i].classes],
					itemRow: 0,
				})
				const continued = ep.startDate < weekStart
				const startOffset = continued ? 0 : CalendarMath.dayDiff(weekStart, ep.startDate)
				const span = Math.min(daysCountOfMonth - startOffset, CalendarMath.dayDiff(CalendarMath.addDays(weekStart, startOffset), ep.endDate) + 1)
				if (continued) ep.classes.push("continued")
				
				console.log("getWeekItems")
				console.log(ep.endDate)
				console.log(startOffset)
				
				if (CalendarMath.dayDiff(weekStart, ep.endDate) > 29) ep.classes.push("toBeContinued")
				if (CalendarMath.isInPast(ep.endDate)) ep.classes.push("past")
				if (ep.originalItem.url) ep.classes.push("hasUrl")
				
				for (let d = 0; d < daysCountOfMonth; d++) {
					if (d === startOffset) {
						let s = 0
						while (itemRows[d][s]) s++
						ep.itemRow = s
						itemRows[d][s] = true
					} else if (d < startOffset + span) {
						itemRows[d][ep.itemRow] = true
					}
				}
				ep.classes.push(`offset${startOffset}`)
				ep.classes.push(`span${span}`)
				// ep.roomNo = i > 5 ?102 : 103
				results.push(ep)
			}
			console.log("roomNoCheck")
			console.log(results)
			return results
		},

		/*
		Creates the HTML to prefix the item title showing the items start and/or
		end time. Midnight is not displayed.
		*/
		getFormattedTimeRange(item: INormalizedCalendarItem): string {
			const startTime = '<span class="startTime">' + CalendarMath.formattedTime(item.startDate, this.displayLocale, this.timeFormatOptions) + "</span>"
			let endTime = ""
			if (!CalendarMath.isSameDateTime(item.startDate, item.endDate)) {
				endTime =
					//'<span class="endTime">' +
					CalendarMath.formattedTime(item.endDate, this.displayLocale, this.timeFormatOptions) + "</span>"
			}
			return startTime + endTime
		},

		getItemTitle(item: INormalizedCalendarItem): string {
			if (!this.showTimes) return item.title
			return this.getFormattedTimeRange(item) + item.title
		},

		getItemTop(item: INormalizedCalendarItem): string {
			// Compute the top position of the item based on its assigned row within the given week.
			const r = item.itemRow
			const h = this.itemContentHeight
			const b = this.itemBorderHeight
			return `calc(${this.itemTop} + ${r}*${h} + ${r}*${b})`
		},

		getRoomTop(itemRow: number): string {
			// Compute the top position of the item based on its assigned row within the given week.
			const r = itemRow-Number(1)
			const h = this.itemContentHeight
			const b = this.itemBorderHeight
			console.log("Roomtop")
			console.log(`calc(${this.itemTop} + ${itemRow}*${h} + ${itemRow}*${b})`)
			return `calc(${this.itemTop} + ${r}*${h} + ${r}*${b})`
		},
	},
})

</script>
<!--

The CSS below represents only the CSS required for proper rendering (positioning, etc.) and
minimalist default borders and colors. Special-day colors, holiday emoji, item colors,
and decorations like border-radius should be part of a theme. Styles related to the default
header are in the CalendarViewHeader component.

jumper	сүлжмэл ноосон цамц
t-shirt	подволк
shirt	цамц
coat	цув
trousers	өмд
jacket	хүрэм
jeans	жинс
sweatshirt	светер
top	цамц
trainers	пүүз
jug	ваар хэлбэртэй шилэн сав
bottle	 лонх
carton	цаасан хайрцаг /сүү ундааны/
tub	торх/масло нтр хийдэг сав/
jar	варианы шил
can	лааз
bowl	аяга
box	хайрцаг
tube	хуванцар урт сав/ оо зэрэг хийдэг/
tin	төмөр лааз
packet	пакет
-->
<style>
/* Position/Flex */


.fixedContainer {
    background-color:#ddd;
    position: fixed;
    padding: 2em;
    left: 50%;
    /* top: 0%; */
    transform: translateX(-50%);
}

.fixed, .sticky
{
  font-size: 1.4em;
  padding: 10px;
  z-index: 1;
}
.fixed
{
  position: fixed;
  /* background-color: #34495e; */
  /* color: white; */
  /* width: 100%; */
  /* left: 0; */
  text-align: center;
  z-index: 2;
}
.sticky
{
  position: sticky;
  top: 60px;
  background-color: #2ecc71;
}
/* Make the calendar flex vertically */
.cv-wrapper {
	display: flex;
	flex-direction: column;
	overflow-x: auto;
	white-space: nowrap;
	/* overflow: scroll; */
	/* flex-grow: 1;
	height: 100%;
	min-height: 100%;
	min-width: 100%;
	max-height: 100%;
	overflow-x: auto;
	overflow-y: auto; */
}

.cv-wrapper,
.cv-wrapper div {
	box-sizing: border-box;
	line-height: 1em;
	font-size: 1em;
	
}

/* 
.cv-wrapper::before {
	box-sizing: inherit;
}


.cv-wrapper::after {
	box-sizing: inherit;
} */
.cv-header-days {
	display: flex;
	flex-grow: 0;
	flex-shrink: 0;
	flex-basis: auto;
	flex-flow: row nowrap;
	border-width: 0 0 0 1px;
}

.cv-header-day {
	display: flex;
	flex-grow: 1;
	flex-shrink: 0;
	flex-basis: 0;
	flex-flow: row nowrap;
	align-items: center;
	justify-content: center;
	text-align: center;
	border-width: 1px 1px 0 0;
}

/* The calendar grid should take up the remaining vertical space */
.cv-weeks {
	display: flex;
	flex-grow: 1;
	flex-shrink: 1;
	flex-basis: auto;
	flex-flow: column nowrap;
	border-width: 0 0 1px 1px;

	/* Allow grid to scroll if there are too may weeks to fit in the view */
	/* overflow-y: auto;
	overflow-x: auto;
	-ms-overflow-style: none; */
}

.cv-weeknumber {
  z-index: 10;
  position: -webkit-sticky;
  position: sticky;
  background-color: rgb(252, 253, 252);
	
	text-align: center;
	border-width: 1px 1px 0px 1px;
	border-style: solid;
	line-height: 1; 
}

#div1 {
  position: fixed;
  background: blue;
  font-size: 50px;
}
.cv-weeknumber.freeze {
  z-index: 10;
  position: relative;
}

.cv-weeknumber.freeze_vertical {
  z-index: 5;
  position: relative;
}

.cv-weeknumber.freeze_horizontal {
  z-index: 1;
  position: relative;
}

.cv-freeze-span {
	width: 2rem;
	/* position: fixed;	
	*/
	text-align: center;
	border-width: 1px 1px 1px 1px;
	border-style: solid;
	line-height: 1;
	height: 6rem;
	background: ivory;
}

.sticky-col {
	z-index: 10;
  position: -webkit-sticky;
  position: sticky;
  background-color: rgb(51, 129, 44);
}

.first-col {
	/* width: 2rem; */
	
  /* width: 100px; */
  min-width: 90px;
  max-width: 100px;
  left: 0px;
}
/* Use flex basis of 0 on week row so all weeks will be same height regardless of content */
.cv-week {
	display: flex;

	/* Shorthand flex: 1 1 0 not supported by IE11 */
	flex-grow: 1;
	flex-shrink: 1;
	flex-basis: 0;
	flex-flow: row nowrap;
	min-height: 6em;
	border-width: 0;

	/* Allow week items to scroll if they are too tall */
	position: relative;
	width: 100%;
	/* overflow-y: auto;
	-ms-overflow-style: none; */
}

.cv-weekdays {
	display: flex;

	/* Shorthand flex: 1 1 0 not supported by IE11 */
	flex-grow: 1;
	flex-shrink: 0;
	flex-basis: 0;
	flex-flow: row nowrap;

	/* Days of the week go left to right even if user's language is RTL (#138) */
	direction: ltr;
	position: relative;
	/* overflow-y: auto;
	overflow-x: hidden; */
}

.cv-day {
	display: flex;

	/* Shorthand flex: 1 1 0 not supported by IE11 */
	flex-grow: 1;
	flex-shrink: 0;
	flex-basis: 0;
	position: relative; /* Fallback for IE11, which doesn't support sticky */
	position: -webkit-sticky; /* When week's items are scrolled, keep the day content fixed */
	top: 0;
	border-width: 1px 1px 0 0;

	/* Restore user's direction setting (overridden for week) */
	direction: initial;
	border-style: dashed
}

.cv-room-header {
	height: auto;
	align-self: flex-start;
	border-width: 1px 1px 1px 1px;
}

.cv-room {

	display: flex;

	/* Shorthand flex: 1 1 0 not supported by IE11 */
	flex-grow: 1;
	flex-shrink: 0;
	flex-basis: 0;
	position: absolute;
	white-space: nowrap;
	overflow: hidden;
	padding: 0.2em;
	/* background-color: #f7f7f7; */
	border-width: 2px;

	/* Restore user's direction setting (overridden for week) */
	direction: initial;
/* 
	border-color: #0a0909;
	border-radius: 0.25em;
	background-color: var(--event-color-graphite);
	color: white;
	padding-top: 0.325em;
	padding-bottom: 0.325em;
	padding-left: 0.6em;
	height: auto;
	align-self: flex-start;
	margin-right: 0.5em; */
}
.cv-day-number {
	height: auto;
	align-self: flex-start;
}

/*
A bug in Microsoft Edge 41 (EdgeHTML 16) has been reported (#109) where days "disappear" because they are
wrapping under the next week (despite the "nowrap" on cv-week). This appears to be an issue specifically
with our metrics and the sticky positioning. I was not able to reproduce this issue in Edge 38, 42, or 44.
I'm reticent to turn off the sticky functionality for all Edge users because of one version (or perhaps an
interaction of that version with a specific graphics adapter or other setting). So instead, I'm leaving this
as an example for anyone forced to support Edge 41 who may see the same issue. If that's the case, just
add this selector to your own CSS.

@supports (-ms-ime-align: auto) {
	.cv-day {
		position: relative;
	}
}
_:-ms-lang(x),
.cv-day {
	position: relative;
}
.cv-day-number {
	position: absolute;
	right: 0;
}
*/

.cv-day[draggable],
.cv-item[draggable] {
	user-select: none;
}
.cv-item[resizable] {
	grid: 90px;

}

.cv-item {
	position: absolute;
	white-space: nowrap;
	overflow: hidden;
	background-color: #f7f7f7;
	border-width: 1px;
	resize:horizontal;
	/* Restore user's direction setting (overridden for week) */
	direction: initial;
}

/* Wrap to show entire item title on hover */
/* .cv-wrapper.wrap-item-title-on-hover .cv-item:hover {
	white-space: nowrap;
	max-width: fit-content;
	z-index: 1;
} */

/* Colors */

.cv-header-days,
.cv-header-day,
.cv-weeks,
.cv-week,
.cv-day,
.cv-item {
	border-style: solid;
	border-color: #ddd;
}

/* Item Times */
.cv-item .endTime::before {
	content: "-";
}

/* Internal Metrics */
.cv-header-day,
.cv-day-number,
.cv-item {
	padding: 0.2em;
}

/* Allows emoji icons or labels (such as holidays) to be added more easily to specific dates by having the margin set already. */
.cv-day-number::before {
	margin-right: 0.5em;
}

.cv-item.offset0 {
	left: 0;
}

.cv-item.offset1 {
	left: 90px;
}

.cv-item.offset2 {
	left: 182px;
}

.cv-item.offset3 {
	left: 273px;
}

.cv-item.offset4 {
	left: 364px;
}

.cv-item.offset5 {
	left: 455px;
}

.cv-item.offset6 {
	left: 546px;
}
.cv-item.offset7 {
	left: 637px;
}
.cv-item.offset8 {
	left: 728px;
}
.cv-item.offset9 {
	left: 819px;
}
.cv-item.offset10 {
	left: 910px;
}
.cv-item.offset11 {
	left: 1001px;
}
.cv-item.offset12 {
	left: 1092px;
}
.cv-item.offset13 {
	left: 1183px;
}
.cv-item.offset14 {
	left: 1274px;
}
.cv-item.offset15 {
	left: 1365px;
}
.cv-item.offset16 {
	left: 1456px;
}
.cv-item.offset17 {
	left: 1547px;
}
.cv-item.offset18 {
	left: 1638px;
}
.cv-item.offset19 {
	left: 1729px;
}
.cv-item.offset20 {
	left: 1820px;
}
.cv-item.offset21 {
	left: 1911px;
}
.cv-item.offset22 {
	left: 2002px;
}
.cv-item.offset23 {
	left: 2093px;
}
.cv-item.offset24 {
	left: 2184px;
}
.cv-item.offset25 {
	left: 2275px;
}
.cv-item.offset26 {
	left: 2366px;
}
.cv-item.offset27 {
	left: 2457px;
}
.cv-item.offset28 {
	left: 2548px;
}
.cv-item.offset29 {
	left: 2639px;
}
.cv-item.offset30 {
	left: 2730px;
}

/* Metrics for items spanning dates */

.cv-item.span1 {
	width: (90px - 0.05em);
}

.cv-item.span2 {
	width: (180px - 0.05em);
}

.cv-item.span3 {
	width: (270px - 0.05em);
}

.cv-item.span4 {
	width: (360px - 0.05em);
}

.cv-item.span5 {
	width: (450px - 0.05em);
}

.cv-item.span6 {
	width: (540px - 0.05em);
}

.cv-item.span7 {
	width: (630px - 0.05em);
}

.cv-item.span8 {
	width: (720px - 0.05em);
}
.cv-item.span9 {
	width: (810px - 0.05em);
}
.cv-item.span10 {
	width: (900px - 0.05em);
}
.cv-item.span11 {
	width: (1100px - 0.05em);
}
.cv-item.span12 {
	width: (1200px - 0.05em);
}
.cv-item.span13 {
	width: (1300px - 0.05em);
}
.cv-item.span14 {
	width: (1400px - 0.05em);
}
.cv-item.span15 {
	width: (1500px - 0.05em);
}
.cv-item.span16 {
	width: (1600px - 0.05em);
}
.cv-item.span17 {
	width: (1700px - 0.05em);
}
.cv-item.span18 {
	width: (1800px - 0.05em);
}
.cv-item.span19 {
	width: (1900px - 0.05em);
}
.cv-item.span20 {
	width: (2000px - 0.05em);
}
.cv-item.span21 {
	width: (2100px - 0.05em);
}
.cv-item.span22 {
	width: (2200px - 0.05em);
}
.cv-item.span23 {
	width: (2300px - 0.05em);
}
.cv-item.span24 {
	width: (2400px - 0.05em);
}
.cv-item.span25 {
	width: (2500px - 0.05em);
}
.cv-item.span26 {
	width: (2600px - 0.05em);
}
.cv-item.span27 {
	width: (2700px - 0.05em);
}
.cv-item.span28{
	width: (2800px - 0.05em);
}
.cv-item.span29 {
	width: (2900px - 0.05em);
}
.cv-item.span30 {
	width: (3000px - 0.05em);
}
.cv-item.span31 {
	width: (3100px - 0.05em);
}

/* Hide scrollbars for the grid and the week */
.cv-weeks::-webkit-scrollbar,
.cv-week::-webkit-scrollbar {
	width: 0; /* remove scrollbar space */
	background: transparent; /* optional: just make scrollbar invisible */
}
</style>