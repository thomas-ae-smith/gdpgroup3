package com.your4.tests;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;

import com.wowza.wms.application.IApplicationInstance;
import com.wowza.wms.plugin.livestreamrecord.ModuleLiveStreamRecord;

public class RecordingWorker extends Thread {

		public Timer mTimer;
		public TimerTask mTask;
		public ModuleLiveStreamRecord rec;
		public IApplicationInstance appInstance;
		public HashMap<String, RecordingObj> currentRecordings;
	    public static final String dbUrl = "jdbc:mysql://77.244.130.51:3307/inspirit_inqb8r";
	    public static final String dbClass = "com.mysql.jdbc.Driver";
	    
	    public RecordingWorker(IApplicationInstance appInst){
			currentRecordings = new HashMap<String, RecordingObj>();
			this.appInstance = appInst;
			rec = new ModuleLiveStreamRecord();
			mTask = new TimerTask(){
				private ResultSet rs;
				
				public void run(){
                	try {
						Class.forName("com.mysql.jdbc.Driver");
						
	               		Connection con = DriverManager.getConnection (dbUrl, "teamgdp", "MountainDew2012");
	                    Statement stmt = con.createStatement();
	                    rs = stmt.executeQuery("SELECT epg.key, epg.channelID, epg.rawID, "
	                            + "CONCAT(epg.date, ' ', epg.start_time_GMT) as startTimeStamp, "
	                            + "DATE_ADD(CONCAT(epg.date, ' ', epg.start_time_GMT), INTERVAL epg.duration_min MINUTE) as end_timestamp "
	                            + "FROM inspirit_inqb8r.project4_epg as epg WHERE CONCAT(epg.date, ' ', epg.start_time_GMT) "
	                            + "BETWEEN DATE_SUB('" + Utils.getCurrentTimeStamp() + "', INTERVAL 1 MINUTE) "
	                            + "AND DATE_ADD('" + Utils.getCurrentTimeStamp() + "', INTERVAL 1 MINUTE);");
	
	                    //Stop any completed recordings
	                    for (String rawID : currentRecordings.keySet()){
	                        if (currentRecordings.get(rawID).hasEnded()){
	                            RecordingObj rec = currentRecordings.remove(rawID);
	                            System.out.println(rec.getRawID());
	                        }
	                    }
	                    
	                    //Start any new recordings needed
	                    while (rs.next()) {
	                        if (!(currentRecordings.containsKey(rs.getString("rawID")))){
	                            if (Utils.getStreamNameFromChannelID(rs.getLong("channelID")) != null){
	                                currentRecordings.put(rs.getString("rawID"), new RecordingObj(rs.getLong("channelID"), 
	                                        rs.getString("rawID"), rs.getInt("key"), rs.getString("startTimeStamp"), rs.getString("end_timestamp")));
	                                currentRecordings.get(rs.getString("rawID")).sendCommand(RecordingActionEnum.startRecording);
	                            }
	                        }
	                    }
                	} catch (ClassNotFoundException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (SQLException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}finally{
						if (rs != null){
							try {
								rs.close();
							} catch (SQLException e) {
								// TODO Auto-generated catch block
								e.printStackTrace();
							}
						}
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
