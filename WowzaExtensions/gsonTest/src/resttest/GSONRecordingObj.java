package resttest;

import com.google.gson.Gson;
import com.google.gson.annotations.Expose;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.Calendar;
import java.util.concurrent.Delayed;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Feldoh
 */
public class GSONRecordingObj implements Delayed{
    //Constants
    private static final String recordURL = "http://152.78.144.19:8086/livestreamrecord";
    public static final String outputPath = "C:\\WowzaMediaServer\\content\\";
    private static final String charset = "UTF-8";
    private static final String app = "your4";
    private static final String append = "false";
    private static final String version = "false";
    private static final String startonkeyframe = "true";
    private static final String recorddata = "true";
    private static final String format = "2";
    
    //GSON fields
    @Expose private String id;
    @Expose private String programme_uid;
    @Expose private String channel_uid;
    @Expose private String timestamp;
    @Expose private String duration;
    @Expose private String programmeRecordState;
    
    //Instance variables
    private ChannelMapper channelMapper;
    private URL controlURL;
    private Gson gson;
    
    //Delay fields
    private long delay;
    private long origin;
    
    public GSONRecordingObj(){
        //No args constructor
    }
    
    public void init(ChannelMapper channelMapper, Gson gsonInstance){
        this.channelMapper = channelMapper;
        this.gson = gsonInstance;
        try {
            this.controlURL = new URL("http://your4.tv/api/schedule/" + getId());
        } catch (MalformedURLException ex) {
            //TODO: cannot happen
        }
    }

    /**
     * @return the programme_uid
     */
    public String getProgramme_uid() {
        return programme_uid;
    }

    /**
     * @param programme_uid the programme_uid to set
     */
    public void setProgramme_uid(String programme_uid) {
        this.programme_uid = programme_uid;
    }

    /**
     * @return the channel_uid
     */
    public String getChannel_uid() {
        return channel_uid;
    }

    /**
     * @param channel_uid the channel_uid to set
     */
    public void setChannel_uid(String channel_uid) {
        this.channel_uid = channel_uid;
    }

    /**
     * @return the timestamp
     */
    public String getTimestamp() {
        return timestamp;
    }

    /**
     * @param timestamp the timestamp to set
     */
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * @return the duration
     */
    public String getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(String duration) {
        this.duration = duration;
    }

    /**
     * @return the programmeRecordState
     */
    public String getProgrammeRecordState() {
        return programmeRecordState;
    }

    /**
     * @param programmeRecordState the programmeRecordState to set
     */
    public void setProgrammeRecordState(String programmeRecordState) {
        this.programmeRecordState = programmeRecordState;
    }

    /**
     * @return the id
     */
    public String getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(String id) {
        this.id = id;
    }
    
    /**
     * @param action the action to perform
     */
    private URL getControlURL(RecordingActionEnum action) throws MalformedURLException, UnsupportedEncodingException{
        if (action == RecordingActionEnum.startRecording){
            return new URL(recordURL.concat("?").concat(String.format
            ("app=%s&streamname=%s&append=%s&version=%s&startonkeyframe=%s&recorddata=%s&output=%s&format=%s&action=%s", 
                URLEncoder.encode(app, charset), 
                URLEncoder.encode(channelMapper.getChannelByUID(channel_uid).getUrl(), charset), 
                URLEncoder.encode(append, charset), 
                URLEncoder.encode(version, charset), 
                URLEncoder.encode(startonkeyframe, charset), 
                URLEncoder.encode(recorddata, charset), 
                URLEncoder.encode(getOutputPath(), charset), 
                URLEncoder.encode(format, charset),
                URLEncoder.encode(action.toString(), charset))));
        }else{
            return new URL(recordURL.concat("?").concat(String.format
            ("app=%s&streamname=%s&action=%s", 
                URLEncoder.encode(app, charset), 
                URLEncoder.encode(channelMapper.getChannelByUID(channel_uid).getUrl(), charset),
                URLEncoder.encode(action.toString(), charset))));
        }
    }
    
    private String getOutputPath(){
        return outputPath.concat(getProgramme_uid()).concat(".mp4");
    }
    
    private int sendCommand(RecordingActionEnum action){
        try {
            URLConnection connection = getControlURL(action).openConnection();
            connection.setRequestProperty("Accept-Charset", charset);
            int status = ((HttpURLConnection) connection).getResponseCode();
            System.out.println(Calendar.getInstance().toString());
            System.out.println(connection.toString());
            System.out.println(action.toString() + " - Recorder responded: " + status);
            return status;
        } catch (IOException ex) {
            System.out.println("failed to send " + action.toString() + "command to recorder for: " + programme_uid);
            return 400;
        }
    }
    
    public void startRecording(){
        if (sendCommand(RecordingActionEnum.startRecording) == 200){
            setProgrammeRecordState("1");
            updateRecordingStatus();
        }
    }
    
    public void stopRecording(){
        if (sendCommand(RecordingActionEnum.stopRecording) == 200){
            setProgrammeRecordState("2");
            updateRecordingStatus();
            this.origin = System.currentTimeMillis();
            try{
                if (Long.valueOf(getDuration()) > 0){
                    this.delay = Long.valueOf(getDuration()) * 1000;
                }else{
                    this.delay = 24000000; //Assume 4 hours
                }
            }catch(Exception ex){
                this.delay = 24000000; //Assume 4 hours
            }
        }
    }
    
    public void deleteRecording(){
        if (sendCommand(RecordingActionEnum.stopRecording) == 200){
            setProgrammeRecordState("3");
            updateRecordingStatus();
            this.origin = System.currentTimeMillis();
            try{
                if (Long.valueOf(getDuration()) > 0){
                    this.delay = Long.valueOf(getDuration()) * 1000;
                }else{
                    this.delay = 24000000; //Assume 4 hours
                }
            }catch(Exception ex){
                this.delay = 24000000; //Assume 4 hours
            }
        }
    }
    
    public void removeFromFileSystem(){
        //TODO: make delete function
    }
    
    public void updateRecordingStatus(){
        HttpURLConnection conn = null;
        OutputStreamWriter out = null;
        try {
            conn = (HttpURLConnection) controlURL.openConnection();
            conn.setDoOutput(true);
            conn.setRequestMethod("PUT");
            conn.setRequestProperty("Content-Type", "application/json");
            out = new OutputStreamWriter(conn.getOutputStream());
            if (conn.getResponseCode() == 200){
                String json = gson.toJson(this);
                out.write(json);
                System.out.println(json);
            }else{
                System.out.println(conn.getResponseCode());
                System.out.println(conn.getResponseMessage());
            }
        } catch (IOException ex) {
            ex.printStackTrace();
        }finally{
            conn.disconnect();
            try {
                out.close();
            } catch (IOException ex) {
                Logger.getLogger(GSONRecordingObj.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }

    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert( delay - ( System.currentTimeMillis() - origin ), TimeUnit.MILLISECONDS );
    }

    @Override
    public int compareTo(Delayed delayed) {
        if( delayed == this ) {
            return 0;
        }
        
        if( delayed instanceof GSONRecordingObj ) {
            long diff = delay - ( ( GSONRecordingObj )delayed ).delay;
            return ( ( diff == 0 ) ? 0 : ( ( diff < 0 ) ? -1 : 1 ) );
        }
        
        long d = ( getDelay( TimeUnit.MILLISECONDS ) - delayed.getDelay( TimeUnit.MILLISECONDS ) );
        return ( ( d == 0 ) ? 0 : ( ( d < 0 ) ? -1 : 1 ) );
    }
}
