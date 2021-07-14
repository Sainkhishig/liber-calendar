<template>
	<div id="app">
		<!-- <div class="box">			
			<vue-scheduler-lite :schedule-data="data" :setting="settingData" />
			<div class="field">
				<label class="label">Period UOM</label>
				<div class="control">
					<div class="select">
						<select v-model="displayPeriodUom">
							<option>month</option>
							<option>week</option>
							<option>year</option>
						</select>
					</div>
				</div>
			</div>
			<div class="field">
				<label class="label">Period Count</label>
				<div class="control">
					<div class="select">
						<select v-model="displayPeriodCount">
							<option :value="1">1</option>
							<option :value="2">2</option>
							<option :value="3">3</option>
						</select>
					</div>
				</div>
			</div>
			<div class="field">
				<label class="label">Title</label>
				<div class="control">
					<input v-model="newItemTitle" class="input" type="text" />
				</div>
			</div>

			<div class="field">
				<label class="label">Start date</label>
				<div class="control">
					<input v-model="newItemStartDate" class="input" type="date" />
				</div>
			</div>

			<div class="field">
				<label class="label">End date</label>
				<div class="control">
					<input v-model="newItemEndDate" class="input" type="date" />
				</div>
			</div>

			<button class="button is-info" @click="clickTestAddItem">Add Item</button>
			<div v-if="message" class="notification is-success">{{ message }}</div>
		</div> -->
		
		<!-- Calemdar -->
		<calendar-view
			:show-date="showDate"
			:items="items"
			:enable-date-selection="true"
			:selection-start="selectionStart"
			:selection-end="selectionEnd"
			:display-period-uom="displayPeriodUom"
			:display-period-count="displayPeriodCount"
			:display-week-numbers="false"
			:enable-drag-drop="true"
			:item-top="themeOptions.top"
			:item-content-height="themeOptions.height"
			:item-border-height="themeOptions.border"
			:class="`theme-` + theme"
			:current-period-label="themeOptions.currentPeriodLabel"
			class="holiday-us-traditional holiday-us-official"
			@date-selection-start="setSelection"
			@date-selection="setSelection"
			@date-selection-finish="finishSelection"
			@drop-on-date="onDrop"
		>
			<template #header="{ headerProps }">
				<calendar-view-header
					:header-props="headerProps"
					:previous-year-label="themeOptions.previousYearLabel"
					:previous-period-label="themeOptions.previousPeriodLabel"
					:next-period-label="themeOptions.nextPeriodLabel"
					:next-year-label="themeOptions.nextYearLabel"
					@input="setShowDate"
				/>
			</template>
		</calendar-view>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
// import VueDragResize  from "vue-drag-resize"
import CalendarView from "./CalendarView.vue"
import CalendarViewHeader from "./CalendarViewHeader.vue"

import { ICalendarItem, INormalizedCalendarItem } from "./ICalendarItem"
import CalendarMath from "./CalendarMath"
// import VueDragResize from "vue-drag-resize"
// import Resizeablediv from "./components/resizeablediv.vue"
// import VueResizable from './components/vue-resizable.vue'

class AppState {
	message: string =""
	showDate: Date = new Date()
	startDate: Date = new Date()
	selectionStart: Date | null = null
	selectionEnd: Date | null = null
	theme: string = "gcal"
	items: Array<ICalendarItem> = []
	displayPeriodUom: string = "gcal"
	newItemTitle: string =""
	newItemStartDate: Date = new Date()
	newItemEndDate: Date = new Date()

	width: number = 0
	height: number = 0
	top: number = 0
	left: number = 0
}

export default defineComponent({
	name: "CalendarDemoApp",
	components: {
		CalendarView,
		CalendarViewHeader,
		// Resizeablediv,
		// VueDragResize 
	},
	data: () => new AppState(),
	computed: {
		themeOptions(): any {
			return this.theme == "gcal"
				? {
						top: "0.1em",
						height: "2.1em",
						border: "0px",
						previousYearLabel: "\uE5CB\uE5CB",
						previousPeriodLabel: "\uE5CB",
						nextPeriodLabel: "\uE5CC",
						nextYearLabel: "\uE5CC\uE5CC",
						currentPeriodLabel: "Today",
				  }
				: {
						top: "1.4em",
						height: "1.4em",
						border: "2px",
						previousYearLabel: "<<",
						previousPeriodLabel: "<",
						nextPeriodLabel: ">",
						nextYearLabel: ">>",
						currentPeriodLabel: "",
				  }
		},
	},
	mounted() {
		this.items = [...Array(25)].map((_, i) => this.getRandomEvent(i))
	},
	methods: {
		// resize(newRect) {
        //         this.width = newRect.width;
        //         this.height = newRect.height;
        //         this.top = newRect.top;
        //         this.left = newRect.left;
        //     },
		setShowDate(d: Date) {
			this.showDate = d
			this.message = `Changing calendar view to ${d.toLocaleDateString()}`
		},
		setSelection(dateRange: Array<Date>) {
			this.selectionEnd = dateRange[1]
			this.selectionStart = dateRange[0]
		},
		onClickDay(d: Date) {
			this.selectionStart = null
			this.selectionEnd = null
			this.message = `You clicked: ${d.toLocaleDateString()}`
		},
		// onClickItem(e: EventListener) {
		// 	this.message = `You clicked: ${e.title}`
		// },
		finishSelection(dateRange: Array<Date>) {
			this.setSelection(dateRange)
			
			this.message = `You selected: ${this.selectionStart} -${this.selectionEnd}`
		},
		getRandomEvent(index: number): ICalendarItem {
			const startDay = Math.floor(Math.random() * 28 + 1)
			const endDay = Math.floor(Math.random() * 4) + startDay
			var d = new Date()
			var i = {
				id: index.toString(),
				title: "Event " + (index + 1),
				startDate: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), startDay)),
				endDate: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), endDay)),
				classes: Math.random() > 0.9 ? ["custom-date-class-red"] : null,
				roomNo: index < 5 ? Number(102) : Number(103)
				}
			return i
		},
		onDrop(item: INormalizedCalendarItem, date: Date) {
			// Determine the delta between the old start date and the date chosen,
			// and apply that delta to both the start and end date to move the item.
			console.log("ONDROPAPP ")
			console.log(item.originalItem.roomNo)
			console.log(item.roomNo)
			console.log(item.itemRow)			
			
			const eLength = CalendarMath.dayDiff(item.startDate, date)
			item.originalItem.startDate = CalendarMath.addDays(item.startDate, eLength)
			item.originalItem.endDate = CalendarMath.addDays(item.endDate, eLength)
			item.originalItem.roomNo = item.roomNo
		},
		clickTestAddItem() {
			this.items.push({
				startDate: this.newItemStartDate,
				endDate: this.newItemEndDate,
				title: this.newItemTitle,
				roomNo: 102,
				
				id: "e" + Math.random().toString(36).substr(2, 10),
				
			})
			this.message = "You added a calendar item!"
		},
	},
})



</script>

<style>
@import "../static/css/gcal.css";

/* @import "../static/css/default.css"; */
@import "../static/css/holidays-us.css";

div#app {
	font-family: Avenir, Arial, Helvetica, sans-serif;
	display: flex;
	height: 87vh;
	width: 87vw;
	/* margin-left: auto; */
	margin-right: auto;
}

.cv-item.custom-date-class-red {
	background-color: #f66;
}
</style>

<style scoped>
    .resizable-content {
        height: 100%;
        width: 100%;
        background-color: aqua;
    }
</style>