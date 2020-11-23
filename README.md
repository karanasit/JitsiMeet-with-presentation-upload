# JitsiMeet-with-presentation-upload
Jitsi Meet code that has feature to upload a presentation in the VC session

Steps for setup :

1. Copy the files in the jitsi branch in the relevenat locations for your jitsi meet source download
2. Make the project with make command
3. Copy the code of vcpptcode branch in location /var/www/html of the deployment server
4. Create a nodejs project and copy yhe codes avalibale in the branch FileUpload
5. FileUpload code is nodejs project for uploading and converting the presentation(ppt or pdf) file in the image format
6. vcpptcode is the PHP project that is called from the jitsi session to render the presentation in the VC window,it has feature of multi user view in which if the presentation slide is changed it reflects in all the windows of participants,this has been achieved with impressr.js javascript library
7. The nginx configuration required for proxy rules is also added in the main branch
8. The jitsimeet code is tested with version 2.0.5076
9. The contributors can be reached for queries with emailIds : <ol> <li> milindj@cdac.in </li><li> richajha@cdac.in</li> <li> kasit@cdac.in</li> </ol>
 
