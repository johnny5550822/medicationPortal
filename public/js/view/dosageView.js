/*
 * View for the icons in control panel
 */

//A common fucntion
function checkTime(i)
{
	if (i<10)
	{
		i="0" + i;
	}
	return i;
};

define([
        // These are path alias that we configured in our bootstrap
        'jquery',     
        'underscore', 
        'backbone',   
        'text!view/template/dosageVerification-template.html',
        'text!view/template/drugTakingRecord-template.html',
        'bootstrapLib',
        'd3'

        ], function($, _, Backbone,dosageVerificationTemplate,drugTakingRecordTemplate){
	var	DosageView = Backbone.View.extend({
		template: _.template(dosageVerificationTemplate),
		drugTakingRecordTemplate: _.template(drugTakingRecordTemplate),

		events:function(){
		},

		//Since view is initialized here, it will not run the parent initialization
		initialize:function(){
			// Set the current clock and date
			this.showClock();
			this.showDate();
			setInterval(this.showClock, 1000);
			setInterval(this.showDate, 1000);

			//To check if the device is on/not, btn-danger
			$("#deviceStatusIndicator").addClass("btn-primary");

			//To display the Today medication; indicate whether it has been done or not
			var todayDoses = $(".todayDoses");
			todayDoses.append("<th>No. </th><th>Dosage Time</th>");
			for (var i=0;i<5;i++){
				timeTaken= "00:00:00";
				content = timeTaken + "Taken";
				dosebtn = i;
				var medicationInfo={dosebtn:dosebtn, doses:"Drug1 x 1; Drug2 x 2",doseNo:i,buttonType:"btn-primary", content:content};
				todayDoses.append(this.template(medicationInfo));
			};

			//Show pills record
			var that = this;
			this.socket = io.connect("127.0.0.1:3000");	
			this.socket.on("connect",function(){
				console.log("Client socket.io is establisted");

				//Emit to the server to get information
				that.socket.emit("getAdherenceRecord");

				//When receive the record from database, processing it and generate a table; need to improve it
				that.socket.on("receiveRecord",function(drug_schedule,adherenceEvent){
					//console.log("Get the data:"+JSON.stringify(drug_schedule.length));
					that.showPillsTakingRecord(drug_schedule,adherenceEvent);				
				});
			});
		},

		events: {

		},

		//For rendering a view
		render: function(){

			return this; // enable chained calls
		},

		//Show the current clock
		showClock: function(){
			var today=new Date();
			var h=today.getHours();
			var m=checkTime(today.getMinutes());
			var s=checkTime(today.getSeconds());
			time = h+":"+m+":"+s;
			$(".clock").html(time);
		},

		//Show the current date
		showDate: function(){
			var today = new Date();
			date = today.toDateString();
			$(".date").html(date);
		},

		//Attach the statistic analysis graphs
		showPillsTakingRecord: function(drug_schedule,adherence){
			//preprocessing the drug_schedule
			var fSchedule =[];	//the medication schedule
			for (var i =0; i<drug_schedule.length;i++){
				var schedule = drug_schedule[i];

				//Convert the drug_id to symbol
				switch (schedule.drug_id){
				case 1: 
					schedule.drug_id = "A";
					break;
				case 2: 
					schedule.drug_id = "B";
					break;
				case 3: 
					schedule.drug_id = "C";
					break;
				case 4: 
					schedule.drug_id = "D";
					break;
				default:
					schedule.drug_id = "unknown";		
				break;
				};

				//Convert the drug_id to symbol
				switch (schedule.day_of_week){
				case "1": 
					schedule.day_of_week = "M";
					break;
				case "2": 
					schedule.day_of_week = "T";
					break;
				case "3": 
					schedule.day_of_week = "W";
					break;
				case "4": 
					schedule.day_of_week = "Th";
					break;
				default:
					schedule.day_of_week = "F";		
				break;
				};

				fSchedule.push({drug_id:schedule.drug_id,day_of_week:schedule.day_of_week,time_of_day:schedule.time_of_day,isTaken:false});
				console.log(JSON.stringify(fSchedule[0]));
			};
			for (var j=0;j<adherence.length;j++){
				var adh=adherence[j];
				//conversion
				switch (adh.drug_id){
				case 1: 
					adh.drug_id = "A";
					break;
				case 2: 
					adh.drug_id = "B";
					break;
				case 3: 
					adh.drug_id = "C";
					break;
				case 4: 
					adh.drug_id = "D";
					break;
				default:
					adh.drug_id = "unknown";		
				break;
				};
			}


			for (var j=0;j<adherence.length;j++){
				var adh=adherence[j];
				//do a bit trick here because of the sample data we have
				if (adh.completed_time){
					for (var i=0;i<fSchedule.length;i++){
						var fsc = fSchedule[i];
						theTime = new Date(adh.scheduled_time);
						theDay = JSON.stringify(theTime.getDay());

						//Conversion
						switch (theDay){						
						case "1": 
							theDay = "M";
							break;
						case "2": 
							theDay = "T";
							break;
						case "3": 
							theDay = "W";
							break;
						case "4": 
							theDay = "Th";
							break;
						default:
							theDay = "F";		
						break;
						};

						//console.log("###"+fsc.day_of_week===theDay);
						theTime = checkTime(theTime.getHours()) + ":"+ checkTime(theTime.getMinutes()) + ":" +checkTime(theTime.getSeconds());
						//console.log("a"+fsc.drug_id);
						//console.log("b"+adh.drug_id);
//						console.log(fsc.time_of_day ==theTime); 
						if ((fsc.drug_id==adh.drug_id) && (fsc.time_of_day.toString() == theTime) && (fsc.day_of_week == theDay)){
							fsc.isTaken = true;
							break;
						}
					}
				}
			};
			console.log("!!!!"+JSON.stringify(fSchedule));
			//fSchedule is ready here
			drugTakingRecord = $(".drugTakingRecord tbody");
			theDay = fSchedule[0].day_of_week;
			content = "<tr><td>" + theDay+"</td>";
			for (var k=0;k<fSchedule.length;k++){
				if (theDay!= fSchedule[k].day_of_week){
					content+="</tr>";
					drugTakingRecord.append(content);
					theDay = fSchedule[k].day_of_week;
					content = "<tr><td>" + theDay+"</td>";

					if (fSchedule[k].isTaken){
						content+="<td class='cell-padded-taken'><p>"+fSchedule[k].drug_id+"</p>"+fSchedule[k].time_of_day+"</td>";						
					}else{
						content+="<td class='cell-padded-notTaken'><p>"+fSchedule[k].drug_id+"</p>"+fSchedule[k].time_of_day+"</td>";
					};					
				}else{
					if (fSchedule[k].isTaken){
						content+="<td class='cell-padded-taken'><p>"+fSchedule[k].drug_id+"</p>"+fSchedule[k].time_of_day+"</td>";						
					}else{
						content+="<td class='cell-padded-notTaken'><p>"+fSchedule[k].drug_id+"</p>"+fSchedule[k].time_of_day+"</td>";
					};
				}
//				console.log(fSchedule[k]);
//				console.log(fSchedule[k].drug_id);
			}					
			drugTakingRecord.append(content);
			drugTakingRecord.append("</tr>");

		},

	});


	return DosageView;

});