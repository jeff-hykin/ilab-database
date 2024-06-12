Need to be done:
- Instructions for self-hosting
    - Maybe get it working in an docker container
- Update usage instructions for local videos
- Any changes to get it working on windows

Misc
- "Verified by me" label, maybe use email
- New video demonstrations
- Python library for importing the ILVL format with autocomplete, type hints, and a video API
- Add a creation time for observations, change the format to be `action: mapSplice: [ "@observations", {}, { "[creationTime]": { [[data]] } } ]"`
- Shortcuts for start/stop of observation
    - `S` for start
    - 1-9 for confidence and end of segment
- Shortcuts for input/output data (`i`, `o`)
- Make youtube videoID not be assumed to be in the input search box (require pasting URL)
- Test back behavior for local videos
- Add settings with path to folder for video discovery (ex: looking at home/Videos and calling it something)
- Search custom videos
- Human note section
- Custom data section for each observation
- Instantanious observations (non-segments)
    - `I` for instant observation
- Export/import Yaml instead of JSON


Internal
- work without a database (replacements for addObservation, addSegmentObservation, changeDb, collectionNames, getUsernames, summary.general, summary.labels)
    - Create a data defintion
        - Source, Incrementally Computed (based off changes to other things), Summary Computed (sanity check on incrementally computed things and events)
        - Timing of events, including deletes
        - Replay of events
    - Data structures:
        - Videos
        - Labels
        - Users
        - Observations
    - Indicies for common queries
        - Optimally combining queries by picking smallest index that is a superset of the query
        - ex: Observations from user, Videos from user, Labels from user, Observations from video, segment observations, instant observations
    - `videos:[video]:(numberOfObservations)`
        - when `putLabel`
            - if label edited
                - decrement `videos:[oldVideo]:(numberOfObservations)`
                - increment `videos:[newVideo]:(numberOfObservations)` if not alread in `videos:[newVideo]`
    - `videos:[video]:{[observations]}`
        - when `putLabel`
            - if label edited to new video
                - delete from `videos:[oldVideo]:{observations}`
                - add to `videos:[newVideo]:{observations}`    
        
- Autocomplete for labels and users
- Warning on new user/label

Additional features
- Data heirarchy (database, video, segment)
