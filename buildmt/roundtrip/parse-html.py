from HTMLParser import HTMLParser
import re
import sys

class BPHTMLParser (HTMLParser):

    tag_stack = [] 
    expecting = "start"
    tmp_href = ""
    target = ""

    href = ""
    build_id = ""

    def handle_starttag(self, tag, attrs):
        self.tag_stack.append( tag )
        if ( "a" == tag ):
            for attr in attrs:
                if ( attr[0] == "href" ):
                    self.tmp_href = attr[1]
                    break

    def handle_endtag(self, tag):
        while ( self.tag_stack[-1] != tag ):
            self.tag_stack.pop()
        self.tag_stack.pop()

    def handle_data(self, data):
        if ( len(self.tag_stack) >= 2 and 
             self.tag_stack[-1] == "pre" and
             self.tag_stack[-2] == "body" ):
            m1 = re.search( "(Version: )([0-9]\.[0-9]\.[0-9])", data )
            m2 = re.search( "(Build ID: )([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9])", data )
            if ( None == m1 or None == m2 ):
                die("")
            self.build_id =  m1.group(2).replace( ".", "" ) + "." + m2.group(2).replace( " ", "-" ).replace( ":", "" )
        elif ( self.target in data.lower() ):
            self.href = self.tmp_href

    def get_href(self):
        return self.href

    def get_build_id(self):
        return self.target[0] + self.build_id

    def set_target(self, target):
        self.target = target

def die(message):
    if ( "" != message ):
        print message
    sys.exit(1)

# parse the file
if ( len(sys.argv) != 2 ):
    die( "Wrong number of arguments" )
parser = BPHTMLParser()
parser.set_target( sys.argv[1] )
parser.feed( sys.stdin.read() )
if ( parser.get_href() == "" or parser.get_build_id() == "" ):
    die( "HTML file parsed incorrectly" )

# print out the output
print parser.get_href(), parser.get_build_id()
