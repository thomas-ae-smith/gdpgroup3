package Your4Recorder;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.concurrent.DelayQueue;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Feldoh
 */
public class Your4Recorder extends Thread{
    //Instance Variables
    private URL getUrl = null;
    private final String putUrlBase = "http://your4.tv/api/schedule/"; //TODO: Get from config
    private HttpURLConnection conn;
    private GSONRecordingObj[] shows;
    private DelayQueue<GSONRecordingObj> recordedShows;
    private DelayQueue<GSONRecordingObj> graveyard;
    private Gson gson;
    private ChannelMapper channelMap;
    private HashMap<String, GSONRecordingObj> recordings; //(Channel_UID->recording)
        
    public Your4Recorder(){
        try {
            //Initialise objects
            channelMap = new ChannelMapper();
            recordings = new HashMap<>();
            recordedShows = new DelayQueue<>();
            graveyard = new DelayQueue<>();
            gson = new GsonBuilder().excludeFieldsWithoutExposeAnnotation().create();
                    
            //Initialise get URL
            getUrl = new URL("http://your4.tv/api/schedule?recordState=0&interval=60");
            
            //Initialise Channel Info
            URL channelUrl = new URL("http://your4.tv/api/channels");
            conn = (HttpURLConnection) channelUrl.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            if (conn.getResponseCode() != 200) {
                    throw new RuntimeException("Failed to retrieve channel info: HTTP error code : " + conn.getResponseCode());
            }

            //Store channel info into the channel mapper
            for (GSONChannel channel : gson.fromJson(new BufferedReader(new InputStreamReader((conn.getInputStream()))), GSONChannel[].class)){
                channelMap.put(channel.getUid(), channel);
            }
        } catch (IOException ex) {
            Logger.getLogger(Your4Recorder.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public void start(){
        while (true){
            try {
                //Move expiring recordings to the graveyard and clear any expired graveyard items
                cleanUpExpiredRecordings();
                
                //Get new show info
                conn = (HttpURLConnection) getUrl.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "application/json");

                if (conn.getResponseCode() != 200) {
                        throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
                }
                
                shows = gson.fromJson(new BufferedReader(new InputStreamReader((conn.getInputStream()))), GSONRecordingObj[].class);
                
                //Add recordings
                for (GSONRecordingObj show : shows){
                    //Pass in the mapper
                    show.init(channelMap, gson);
                    
                    //Stop existing recording on that channel
                    if (recordings.containsKey(show.getChannel_uid())){
                        recordings.get(show.getChannel_uid()).stopRecording();
                        recordedShows.add(recordings.remove(show.getChannel_uid()));
                    }
                    
                    //Start the new recording
                    show.startRecording();
                    recordings.put(show.getChannel_uid(), show);
                }
            } catch (IOException ex) {
                ex.printStackTrace();
            } finally {
                conn.disconnect();
            }
        }
    }
            
    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        Your4Recorder t = new Your4Recorder();
        t.start();
    }

    private void cleanUpExpiredRecordings() {
        GSONRecordingObj rec;
        
        //Pull expired recordings out of the list of recorded shows and move to graveyard
        while((rec = recordedShows.poll()) != null){
            rec.deleteRecording();
            graveyard.add(rec); //Move to graveyard
            System.out.println("Recording: " + rec.getProgramme_uid() + " has been moved to the graveyard.");
        }
        
        //Clear graveyard of expired recordings
        while((rec = graveyard.poll()) != null){
            rec.removeFromFileSystem();
            System.out.println("Recording: " + rec.getProgramme_uid() + " has been deleted from the disk.");
        }
    }
}
