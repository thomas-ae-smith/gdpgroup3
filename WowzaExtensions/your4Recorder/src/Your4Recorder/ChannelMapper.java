package Your4Recorder;

import java.util.HashMap;

/**
 *
 * @author Feldoh
 */
public class ChannelMapper extends HashMap<String, GSONChannel>{
    public GSONChannel getChannelByUID(String channelUID){
        return super.get(channelUID);
    }
}
