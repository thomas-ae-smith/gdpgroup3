/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package resttest;

import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

/**
 *
 * @author Feldoh
 */
public class RestTest {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        try {
            //http://your4.tv/api/channels
            //http://your4.tv/api/schedule?interval=1200
            URL url = new URL("http://your4.tv/api/schedule?interval=1200");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            if (conn.getResponseCode() != 200) {
                    throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }

            BufferedReader br = new BufferedReader(new InputStreamReader((conn.getInputStream())));
            RecordingObj[] obj2 = new Gson().fromJson(br, RecordingObj[].class);   
            conn.disconnect();

    } catch (MalformedURLException e) {

            e.printStackTrace();
    } catch (IOException e) {

            e.printStackTrace();

    }
    }
}
