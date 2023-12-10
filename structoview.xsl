<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : structoview.xsl
    Created on : December 10, 2023, 10:31 AM
    Author     : Jens Hofschröer
    Description:
        convert a structogram XML file to a html view.
        Add this to your xml file header:

<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="structoview.xsl"?>
<diagram>
</diagram>

-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="html"/>

  <xsl:template match="/">
    <xsl:variable name="caption">
      <xsl:if test="diagram/@caption">
        <xsl:value-of select="diagram/@caption"/>
        <xsl:text> - </xsl:text>
      </xsl:if>
      <xsl:text>Structoview</xsl:text>
    </xsl:variable>
    <html>
      <head>
        <title>
          <xsl:value-of select="$caption"/>
        </title>
        <link rel="stylesheet" href="structoview.css"/>
      </head>
      <body style="background-color:var(--structoview-bg)">
        <xsl:apply-templates/>
      </body>
    </html>
  </xsl:template>
  
  <xsl:template match="@*">
    <xsl:variable name="attr" select="name()"/>
    <!--<xsl:value-of select="concat('#',$attr,'#', .,'#')"/>-->
    <xsl:attribute name="{$attr}">
      <xsl:value-of select="."/>
    </xsl:attribute>
  </xsl:template>
  
  <xsl:template match="*">
    <xsl:variable name="tagname">
      <xsl:if test="not(starts-with(name(), 'struct-'))">
        <xsl:text>struct-</xsl:text>
      </xsl:if>
      <xsl:value-of select="name()"/>
    </xsl:variable>
    <xsl:element name="{$tagname}">
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>
