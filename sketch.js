// preload table data
let results;
let runner=[];
let aidstationdist=[];
let aidstationnames=[];
let slider;
let racedistance=0.0;
let runnerdistattime=[]; // [timestep][runner] position of every runner as km, at a timestep in the race.
let bins_finisher=[]; // number of runners within each distance bin at given timestep in the race.
let bins_DNF=[];
let medians=[]; // stores median runner's distance for every timestep
let medianpace=[]; // pace of median runner for every distance step
let paceintoaid=[]; // pace[aidstationindex][runner], pace running towards aid station x
let slowestfinisher=[]; // position of person with slowest overall time
let slowestfinisherindex=0; 
let fastestfinisher=[]; 
let fastestfinisherindex=0; 
let numaids=0;
let graphwidth;
let graphheight=300;
let xoffset=30;
let yoffset=70;
let graphgap=70; //gap between graphs
let timesteps=1000; // granularity of time, e.g 100 time steps on the x axis
let diststeps=400; // granularity of distance steps, for histogram bin width
let racemaxtime=28.0;
let focusedrunner=0; 

function preload() {
	results = loadTable('ThamesPath100Results6.csv','csv');
} 

const deepCopyFunction = (inObject) => {
	let outObject, value, key
	if (typeof inObject !== "object" || inObject === null) {return inObject}
	outObject = Array.isArray(inObject) ? [] : {}
	for (key in inObject) {
	  value = inObject[key]
	  outObject[key] = deepCopyFunction(value)
	}
	return outObject
  }

function median(val){
	let values = deepCopyFunction(val)
	if(values.length ===0) return 0;
	values.sort(function(a,b){
	  return a-b;
	});
	var half = Math.floor(values.length / 2);
	if (values.length % 2)
	  return values[half];
	return (values[half - 1] + values[half]) / 2.0;
}

function runnerdistanceattime(r,t) { // distance of runner r at t as % of max race time
	for (let i=0;i<aidstationdist.length;i++){
		if (runner[r][i+2]>t) {
			lasttime=runner[r][i+2-1];
			nexttime=runner[r][i+2];
			lastdist=aidstationdist[i-1];
			nextdist=aidstationdist[i];
			return(t-lasttime)/(nexttime-lasttime)*(nextdist-lastdist)+lastdist;
		}
	}
	return racedistance;
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	graphwidth=windowWidth-50;
	frameRate(30);
	colorMode(HSB, 255, 255, 255, 1);
	slider = createSlider(0.0, timesteps-1, timesteps/4 , 1);
  	slider.position(xoffset, graphheight+10+yoffset);
	slider.style('width', '1000px');
	
	for (let c = 2; c < results.getColumnCount(); c++) {
		aidstationdist[c-2]=results.getNum(1,c);
		aidstationnames[c-2]=results.getString(0,c);
	}
	numaids=aidstationdist.length;
	tmpslowesttime=0;
	tmpfastesttime=999;
	runnerindex=0;
	for (let i=0;i<results.getRowCount()-2;i++) {
		if (1==1){//(i+1==focusedrunner) {
			runner[runnerindex]=[]
			for (let c = 0; c < 2; c++) {
				runner[runnerindex][c] = results.getString(i+2, c)
			}
			runner[runnerindex][1] = results.getNum(i+2, results.getColumnCount()-2);//finish time,0=DNF
			for (let c = 2; c < results.getColumnCount(); c++) {
				runner[runnerindex][c] = results.getString(i+2, c)
			}
			if (runner[runnerindex][1]>0) { // if finisher
				if (runner[runnerindex][1]>tmpslowesttime) {
					tmpslowesttime=runner[runnerindex][1];
					slowestfinisherindex=runnerindex;
				}
				if (runner[runnerindex][1]<tmpfastesttime) {
					tmpfastesttime=runner[runnerindex][1];
					fastestfinisherindex=runnerindex;
				}
			}
			if (runner[runnerindex][0].includes("Per Hedberg")) {focusedrunner=runnerindex;}
			runnerindex++;
		}
	}
	racedistance=aidstationdist[12];

	// calculate histogram data and store in bins, and median distance
	for (let i=0;i<timesteps;i++) { 
		runnerdistattime[i]=[]; 
		bins_finisher[i]=[];
		bins_DNF[i]=[];
		slowestfinisher[i]=racedistance;
		fastestfinisher[i]=0;
		for (let y=0;y<diststeps;y++) {
			bins_DNF[i][y]=0;
		}
		for (let r=0;r<runner.length;r++) {
			runnerdistattime[i][r]=runnerdistanceattime(r,i/timesteps);
			bin = int(runnerdistattime[i][r]/racedistance*diststeps);

			if (runner[r][1]==0) { //DNF
				if (typeof bins_DNF[i][bin] === 'undefined') {
					bins_DNF[i][bin]=1;
				} else {
					bins_DNF[i][bin]+=1;
				}
			} else {  //finisher
				if (r==fastestfinisherindex) {
					fastestfinisher[i]=runnerdistattime[i][r];
				}
				if (r==slowestfinisherindex) {
					slowestfinisher[i]=runnerdistattime[i][r];
				}
				if (typeof bins_finisher[i][bin] === 'undefined') {
					bins_finisher[i][bin]=1;
				} else {
					bins_finisher[i][bin]+=1;
				}
			}
		}
		medians[i]=median(runnerdistattime[i]);	
	}

	// calculate median runner's pace for each distance step
	let timestep=0;
	for (let bin=0;bin<diststeps-20;bin++) {  
		while (medians[timestep]<bin/diststeps*racedistance) { timestep++;}
		medianpace[bin]=(28/timesteps*60*20)/(medians[timestep+20]-medians[timestep]);
	}

	paceintoaid[0]=[];
	for (let a=1;a<numaids;a++) {
		paceintoaid[a]=[];
		for (let r=0;r<runner.length;r++) {
			//v=d/t  , p=min/km  =t/v
			lasttime=runner[r][a+2-1];
			nexttime=runner[r][a+2];
			lastdist=aidstationdist[a-1];
			nextdist=aidstationdist[a];
			paceintoaid[a][r]= max(0,racemaxtime*(nexttime-lasttime)/(nextdist-lastdist)*60);
		}
	}
}

function draw() {
	clear();smooth();
	fill(255,0,255,0.5);
	stroke(0,0,200,1)
	rect(xoffset, yoffset, graphwidth, graphheight); // border 1
	rect(xoffset, graphgap+yoffset+graphheight, graphwidth, graphheight); // border 2
	rect(xoffset, yoffset+(graphgap+graphheight)*2, graphwidth, graphheight); // border 3
	textSize(12);
	fill(255,0,50,0.3);
	stroke(1,0,0,0.1);
	for (let a=0;a<aidstationdist.length;a++) { // aidstations
		x=aidstationdist[a]/racedistance*graphwidth+xoffset;
		line(x,graphheight+yoffset,x,yoffset);
		push();
		translate(x+2,75)
		rotate(PI/2);
		text(aidstationnames[a]+" "+str(int(aidstationdist[a]*10)/10)+"km",0,0);
		pop();
	}
	
	fill(255,0,50,0.3);
	for (let d=0;d<racedistance;d+=10) { // 10km marks
		noStroke();
		let leftoffset=10; if (d<100) {leftoffset=5} if (d==0) {leftoffset=0}
		text(str(d),d/racedistance*graphwidth+xoffset-leftoffset,graphheight+yoffset+13);
		stroke(1,0,0,0.2);
		line(d/racedistance*graphwidth+xoffset,graphheight+yoffset,d/racedistance*graphwidth+xoffset,graphheight+yoffset-5)
	}
	fill(255,0,50,0.3);
	for (let h=0;h<racemaxtime+1;h+=1) { // slider marks
		noStroke();
		text(str(h),h/racemaxtime*988+xoffset+4,graphheight+yoffset+13+35);
		stroke(1,0,0,0.2);
		line(h/racemaxtime*988+xoffset+8,graphheight+yoffset+35,h/racemaxtime*988+xoffset+8,graphheight+yoffset-5+30)
	}

	// Legend
	hue=100;
	stroke(hue,255,255,0.5);
	fill(hue,255,255,0.5);
	rect(xoffset+5,graphheight+yoffset-30,5,5);
	hue=255;
	stroke(hue,255,255,0.5);
	fill(hue,255,255,0.5);
	rect(xoffset+5,graphheight+yoffset-18,5,5);
	noStroke();
	fill(255,0,50,0.5);
	textSize(11);
	text("Finisher",xoffset+15,graphheight+yoffset-23)
	text("DNF",xoffset+15,graphheight+yoffset-10)

	for (let bin=0;bin<diststeps;bin++) { // draw histogram DNF
		hue=255;
		stroke(hue,255,255,0.5);
		fill(hue,255,255,0.5);
		width=bin/diststeps*graphwidth
		height=min(graphheight,5*bins_DNF[slider.value()][bin]);
		rect(width+xoffset,graphheight+yoffset-height,graphwidth/diststeps,height);
	}
	for (let bin=0;bin<diststeps;bin++) { // draw histogram finishers
		hue=100;
		stroke(hue,255,255,0.5);
		fill(hue,255,255,0.5);
		width=bin/diststeps*graphwidth
		height=min(graphheight,5*bins_finisher[slider.value()][bin]);
		rect(width+xoffset,graphheight+yoffset-height,graphwidth/diststeps,height);
	}

	// draw chart area for pace
	noStroke();
	fill(90,255,155,0.8);
	textSize(16);
	text("Median pace",xoffset+110,graphgap+yoffset+graphheight+85)
	fill(20,255,155,0.8);
	text("Cut-off pace",xoffset+110,graphgap+yoffset+graphheight+180)
	textSize(11);
	fill(0,0,0,0.5);
	stroke(1,0,0,0.1);
	for (let i=4;i<15;i++) { 
		y=graphgap+yoffset+graphheight+map(i,3,15,0,300);
		line(xoffset,y,xoffset+graphwidth,y);
		text(str(i)+" min/km",xoffset+5,y-2)
	}
	textSize(16);
	aidindex=0;	
	for (let bin=0;bin<diststeps;bin++) { // draw median pace
		stroke(90,255,155,0.8);
		strokeWeight(2);
		x1=bin/diststeps*graphwidth+xoffset;
		x2=(bin+1)/diststeps*graphwidth+xoffset;
		y=graphgap+yoffset+graphheight+map(medianpace[bin],3,15,0,300);
		line(x1,y,x2,y);

	}
	stroke(20,255,255,0.8);
	y=graphgap+yoffset+graphheight+map(28*60/racedistance,3,15,0,300);
	line(+xoffset,y,xoffset+graphwidth,y);
	strokeWeight(1);
	//cut-off line
	textgap=20;
	stroke(1,0,0,1);
	x=slider.value()*graphwidth/timesteps+xoffset;
	line(x,graphheight+yoffset,x,yoffset+0*textgap+15);
	noStroke();
	fill(0,0,0,1);
	textSize(16);
	text("cut-off",x+5,20+yoffset+0*textgap)
	//median line
	stroke(1,0,0,1);
	x=medians[slider.value()]/racedistance*graphwidth+xoffset;
	line(x,graphheight+yoffset,x,yoffset+2*textgap+15);
	noStroke();
	fill(0,0,0,1);
	textSize(16);
	text("median "+str(round(medians[slider.value()]*10)/10)+"km",x+5,20+yoffset+2*textgap)
	//slowest line
	stroke(1,0,0,1);
	x=slowestfinisher[slider.value()]/racedistance*graphwidth+xoffset;
	line(x,graphheight+yoffset,x,yoffset+1*textgap+15);
	noStroke();
	fill(0,0,0,1);
	textSize(16);
	text("slowest finisher "+str(round(slowestfinisher[slider.value()]*10)/10)+"km",x+5,20+yoffset+1*textgap)
	//record line
	stroke(1,0,0,1);
	x=fastestfinisher[slider.value()]/racedistance*graphwidth+xoffset;
	line(x,graphheight+yoffset,x,yoffset+3*textgap+15);
	noStroke();
	fill(0,0,0,1);
	textSize(16);
	text("record holder "+str(round(fastestfinisher[slider.value()]*10)/10)+"km",x+5,20+yoffset+3*textgap)
	
	// stats
	noStroke();
	fill(0,0,0,0.8);
	textSize(20);
	text(str(round(slider.value()/timesteps*racemaxtime*10)/10)+" hrs",1050,40+graphheight+yoffset)
	textSize(25);
	text("Centurion Thames Path 100",20,30)
	textSize(15);

	let maxrunner=0;
	let maxdist=0;
	for (let r=0;r<runner.length;r++) {
		if ((runner[r][1]==0)&&(runnerdistattime[slider.value()][r]>maxdist)&&(runnerdistattime[slider.value()][r]<racedistance)) {
			maxrunner=r;
			maxdist=runnerdistattime[slider.value()][r];
		}
	}
	//text(str(maxrunner)+" "+str(runner[maxrunner][0])+" "+str(maxdist)+" "+runnerdistattime[slider.value()][maxrunner],50,60)//remove

	//text(str(slider.value())+" "+str(runner[focusedrunner][0])+" "+str(runnerdistattime[slider.value()][focusedrunner]),width/2,60)//remove
	//print(runnerdistattime[370][1462]) // 1462Holgate 370/1000 313/400 126.07km
	//print(focusedrunner,i,bin,runnerdistattime[i][r]) // 1462Holgate 370/1000 313/400 126.07km
	// Daz Carre - Aid STationH - 0.4627 last captured time at 82.02km
}