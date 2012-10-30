package com.your4.tests;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.Date;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import com.wowza.wms.amf.AMFPacket;
import com.wowza.wms.application.IApplicationInstance;
import com.wowza.wms.stream.IMediaStream;
import com.wowza.wms.stream.MediaStreamMap;
import com.wowza.wms.plugin.livestreamrecord.ModuleLiveStreamRecord;

public class RecordingWorker extends Thread {

		public Timer mTimer;
		public TimerTask mTask;
		public ModuleLiveStreamRecord rec;
		public IApplicationInstance appInstance;
		
		public RecordingWorker(IApplicationInstance appInst){
			this.appInstance = appInst;
			rec = new ModuleLiveStreamRecord();
			mTask = new TimerTask()
			{
				String url = "http://152.78.144.19:8086/livestreamrecord";
				String charset = "UTF-8";
				String app = "your4";
				String streamname = "e4.stream";
				String action = "";
				String append = "false";
				String version = "true";
				String startonkeyframe = "false";
				String recorddata = "true";
				String output = "C:\\WowzaMediaServer\\content\\e4Recording.mp4";
				String format = "2";
				
				public void run() 
				{
					
					//Alternate starting and stopping
					if(action.equalsIgnoreCase("startRecording")){
						action = "stopRecording";
					}else{
						action = "startRecording";
					}
										
					try {
						String query = String.format("app=%s&streamname=%s&action=%s&append=%s&version=%s&startonkeyframe=%s&recorddata=%s&output=%s&format=%s", 
						     URLEncoder.encode(app, charset), 
						     URLEncoder.encode(streamname, charset), 
						     URLEncoder.encode(action, charset), 
						     URLEncoder.encode(append, charset), 
						     URLEncoder.encode(version, charset), 
						     URLEncoder.encode(startonkeyframe, charset), 
						     URLEncoder.encode(recorddata, charset), 
						     URLEncoder.encode(output, charset), 
						     URLEncoder.encode(format, charset));
						
						URLConnection connection = new URL(url + "?" + query).openConnection();
						connection.setRequestProperty("Accept-Charset", charset);
						InputStream response = connection.getInputStream();
						int status = ((HttpURLConnection) connection).getResponseCode();
						System.out.println("Recorder responded: " + status);
						
					} catch (UnsupportedEncodingException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (MalformedURLException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (IOException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
				}
			};
		}
		
		public void start(){
			
			if (mTimer==null)
				mTimer = new Timer();
			mTimer.schedule(mTask, 60000, 60000);
			System.out.println("Start StreamWatchDog");
		}
		
		public void finalise(){
			if (mTimer != null){
				mTimer.cancel();
				mTimer=null;
				System.out.println("Stop StreamWatchDog");				
			}
		}
}
