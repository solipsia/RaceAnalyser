// preload table data
let results;
let runner=[];
let aidstationdist=[];
let slider;
let racedistance=0.0;
let racestate=[]; // position of every runner as km, at a timestep in the race.
let bins_finisher=[]; // number of runners within each distance bin at given timestep in the race.
let bins_DNF=[];
let medians=[]; // stores median runner's distance for every timestep
let slowestfinisher=[]; 
let fastestfinisher=[]; 

let graphwidth;
let graphheight=300;
let xoffset=30;
let yoffset=20;
let timesteps=1000; // granularity of time, e.g 100 time steps on the x axis
let diststeps=400; // granularity of distance steps, for histogram bin width


function preload() {
	results = loadTable('ThamesPath100Results3.csv','csv');
} 

function average(nums) {
    return nums.reduce((a, b) => (a + b)) / nums.length;
}
function median(values){
	if(values.length ===0) return 0;
	values.sort(function(a,b){
	  return a-b;
	});
	var half = Math.floor(values.length / 2);
	if (values.length % 2)
	  return values[half];
	return (values[half - 1] + values[half]) / 2.0;
}

function runnerdistanceattime(r,t) {
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
  	slider.position(xoffset, graphheight+20);
	  slider.style('width', '1000px');
	
	for (let c = 2; c < 15; c++) {
		aidstationdist[c-2]=results.getNum(0,c);
	}
	print(results.getColumnCount());
	for (let i=0;i<results.getRowCount()-1;i++) {
		runner[i]=[]
		for (let c = 0; c < 2; c++) {
			runner[i][c] = results.getString(i+1, c)
		}
		runner[i][1] = results.getNum(i+1, results.getColumnCount()-1);//finish time,0=DNF
		for (let c = 2; c < results.getColumnCount(); c++) {
			runner[i][c] = results.getString(i+1, c)
		}
	}
	racedistance=aidstationdist[12];
	for (let i=0;i<timesteps;i++) {
		racestate[i]=[];
		bins_finisher[i]=[];
		bins_DNF[i]=[];
		slowestfinisher[i]=racedistance;
		//fastestfinisher=0;
		for (let y=0;y<diststeps;y++) {
			bins_DNF[i][y]=0;
		}
		for (let r=0;r<runner.length;r++) {
			racestate[i][r]=runnerdistanceattime(r,i/timesteps);
		
			//now put runner in bin
			bin = int(racestate[i][r]/racedistance*diststeps);

			if (runner[r][1]==0) { //DNF
				if (typeof bins_DNF[i][bin] === 'undefined') {
					bins_DNF[i][bin]=1;
				} else {
					bins_DNF[i][bin]+=1;
				}
			} else {  //finisher
				
				slowestfinisher[i]=min(racestate[i][r],slowestfinisher[i])
				//fastestfinisher[i]=max(racestate[i][r],fastestfinisher[i])
				if (typeof bins_finisher[i][bin] === 'undefined') {
					bins_finisher[i][bin]=1;
				} else {
					bins_finisher[i][bin]+=1;
				}
			}
		}
		medians[i]=median(racestate[i]);	

	}
}

function draw() {
	clear();
	noFill();
	fill(255,0,255,0.5);
	stroke(0,0,200,1)
	rect(xoffset, yoffset, graphwidth, graphheight);
	for (let a=0;a<aidstationdist.length;a++) { // aidstation lines
		stroke(1,0,0,0.1);
		x=aidstationdist[a]/racedistance*graphwidth+xoffset;
		line(x,graphheight+yoffset,x,yoffset);
	}
	//fastest line
	// stroke(1,0,0,1);
	// x=fastestfinisher[slider.value()]/racedistance*graphwidth+xoffset;
	// line(x,graphheight+yoffset,x,yoffset);
	// noStroke();
	// fill(0,0,0,1);
	// textSize(16);
	// text("record "+str(round(fastestfinisher[slider.value()]*10)/10)+"km",x+5,20+yoffset+1*15)


	for (let r=0;r<runner.length;r++) { // draw runners
		x=racestate[slider.value()][r]/racedistance*graphwidth+xoffset;
		stroke(runner[r][results.getColumnCount()-1]*255,255,255,0.5); // colour by finish time
		stroke(map((racestate[min(slider.value()+1,timesteps-1)][r]-racestate[slider.value()][r]),0,0.4,0,255),255,255,0.5); // colour pace
		if (runner[r][1]>0) {
			stroke(100,255,255,0.1); 
		} else {
			stroke(255,255,255,0.1); 
		}
		
		
		//line(x,graphheight+yoffset,x,graphheight+yoffset-500);
	}

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
	
	// stats
	noStroke();
	fill(0,0,0,1);
	textSize(20);
	text(str(round(slider.value()/timesteps*28.0*10)/10)+" hrs",50,30+yoffset)

	//text(str((racestate[slider.value()+1][0]-racestate[slider.value()][0])),50,80+yoffset)

}